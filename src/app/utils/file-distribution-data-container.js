/**
 * Class that allows to retrieve distribution-related data for specified file including
 * distribution per Oneprovider and active transfers.
 * 
 * @module utils/file-distribution-data-container
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, set, setProperties, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve, Promise, reject } from 'rsvp';
import { conditional, equal, raw, gt, and, not, notEmpty } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import Looper from 'onedata-gui-common/utils/looper';

export default EmberObject.extend(
  createDataProxyMixin('fileDistributionModel'),
  createDataProxyMixin('transfers'), {
    transferManager: service(),
    onedataConnection: service(),

    /**
     * If set to true, transfers and data distribution will be updated periodically
     * @virtual
     * @type {boolean}
     */
    keepDataUpdated: true,

    /**
     * @virtual
     * @type {Models.File}
     */
    file: undefined,

    /**
     * Initialized in `init()`
     * @type {Looper}
     */
    dataUpdater: undefined,

    /**
     * @type {number}
     */
    slowPollingTime: 10 * 1000,

    /**
     * @type {number}
     */
    fastPollingTime: 4 * 1000,

    /**
     * If true, then file distribution and transfers data should be updated more
     * frequently (due to working transfers on backend).
     * @type {Ember.ComputedProperty<boolean>}
     */
    fastDataUpdateEnabled: gt('activeTransfers.length', raw(0)),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    pollingTime: conditional(
      'keepDataUpdated',
      conditional(
        'fastDataUpdateEnabled',
        'fastPollingTime',
        'slowPollingTime'
      ),
      raw(-1)
    ),

    /**
     * @type {Ember.ComputedProperty<string>}
     */
    fileType: reads('file.type'),

    /**
     * File size. If file is a directory, then size is 0.
     * @type {Ember.ComputedProperty<number>}
     */
    fileSize: conditional(
      equal('fileType', raw('file')),
      'file.size',
      raw(0)
    ),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isFileDistributionLoaded: conditional(
      equal('fileType', raw('file')),
      notEmpty('fileDistributionModelProxy.content'),
      // directories does not have file distribution
      raw(false),
    ),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isFileDistributionLoading: and(
      'fileDistributionModelProxy.isPending',
      not('isFileDistributionLoaded')
    ),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isFileDistributionError: reads('fileDistributionModelProxy.isRejected'),

    /**
     * @type {Ember.ComputedProperty<any>}
     */
    fileDistributionErrorReason: reads('fileDistributionModelProxy.reason'),

    /**
     * Mapping { oneproviderId -> distribution }. Not empty only if file
     * distribution has been successfully loaded. Is empty for directories.
     * @type {Ember.ComputedProperty<OneproviderDistribution>}
     */
    fileDistribution: reads('fileDistributionModel.distributionPerProvider'),

    /**
     * @type {Ember.ComputedProperty<Array<Models.Transfer>>}
     */
    activeTransfers: reads('transfers.ongoingList'),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    endedTransfersCount: reads('transfers.endedCount'),

    /**
     * True if real number of ended transfers for file could overflow the limit
     * (see `fetchTransfers` method). 
     * @type {Ember.ComputedProperty<boolean>}
     */
    endedTransfersOverflow: reads('transfers.endedOverflow'),

    pollingTimeObserver: observer('pollingTime', function pollingTimeObserver() {
      const {
        dataUpdater,
        pollingTime,
      } = this.getProperties(
        'dataUpdater',
        'pollingTime'
      );

      if (get(dataUpdater, 'interval') !== pollingTime) {
        setProperties(dataUpdater, {
          interval: pollingTime,
          immediate: true,
        });
      }
    }),

    init() {
      this._super(...arguments);

      const dataUpdater = Looper.create({
        interval: this.get('pollingTime'),
      });
      dataUpdater.on('tick', () => this.updateData());
      this.set('dataUpdater', dataUpdater);
    },

    willDestroy() {
      try {
        this.get('dataUpdater').destroy();
      } finally {
        this._super(...arguments);
      }
    },

    /**
     * @override
     */
    fetchFileDistributionModel() {
      const file = this.get('file');
      const distributionLoadError = get(file, 'distributionLoadError');

      if (this.get('file.type') === 'file') {
        if (distributionLoadError) {
          // If earlier fetching of distribution ended with error, then just
          // rethrow it. We can't try to reload distribution model because
          // rejected belongsTo relation cannot be reloaded (a bug in Ember).
          return reject(distributionLoadError);
        } else {
          return file.belongsTo('distribution').reload()
            .catch(reloadError => {
              set(file, 'distributionLoadError', reloadError);
              throw reloadError;
            });
        }
      } else {
        return resolve();
      }
    },

    /**
     * Returns Promise, which resolves to object:
     * ```
     * {
     *   ongoingList: Array<Models.Transfer>,
     *   endedCount: number,
     *   endedOverflow: boolean, // true if ended transfers number is
     *     greater than or equal to backend listing limit
     * }
     * ```
     * 
     * @override
     */
    fetchTransfers() {
      const {
        file,
        transferManager,
        onedataConnection,
      } = this.getProperties(
        'file',
        'transferManager',
        'onedataConnection'
      );
      const transfersHistoryLimitPerFile =
        get(onedataConnection, 'transfersHistoryLimitPerFile');

      return transferManager.getTransfersForFile(file).then(({ ongoingList, endedCount }) =>
        Promise.all(ongoingList.map(transferId =>
          transferManager.getTransfer(transferId)
        )).then(transfers => ({
          ongoingList: transfers,
          endedCount,
          endedOverflow: endedCount >= transfersHistoryLimitPerFile,
        }))
      );
    },

    /**
     * @returns {Promise}
     */
    updateData() {
      const {
        fileType,
        isFileDistributionError,
        transfersProxy,
      } = this.getProperties('fileType', 'isFileDistributionError', 'transfersProxy');
      return Promise.all([
        !isFileDistributionError && fileType === 'file' ?
        this.updateFileDistributionModelProxy({ replace: true }) : resolve(),
        !get(transfersProxy, 'isRejected') ?
        this.updateTransfersProxy({ replace: true }) : resolve(),
      ]);
    },

    /**
     * Returns distribution information for given Oneprovider
     * @param {Models.Provider} oneprovider
     * @returns {OneproviderDistribution}
     */
    getDistributionForOneprovider(oneprovider) {
      const {
        isFileDistributionLoaded,
        fileDistribution,
      } = this.getProperties('isFileDistributionLoaded', 'fileDistribution');
      if (isFileDistributionLoaded) {
        const oneproviderEntityId = get(oneprovider, 'entityId');
        return get(fileDistribution, oneproviderEntityId);
      } else {
        return {};
      }
    },
  }
);
