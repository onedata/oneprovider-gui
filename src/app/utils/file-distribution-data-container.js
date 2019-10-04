import EmberObject, { get, set, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve, Promise } from 'rsvp';
import { conditional, equal, raw, gt, and, not } from 'ember-awesome-macros';
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
    keepDataUpdated: false,
    
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
     * @type {Ember.ComputedProperty<number|null>}
     */
    pollingTime: conditional(
      'keepDataUpdated',
      conditional(
        'fastDataUpdateEnabled',
        'fastPollingTime',
        'slowPollingTime'
      ),
      raw(null)
    ),

    /**
     * @type {Ember.ComputedPropert'y<string>}
     */
    fileType: reads('file.type'),

    fileSize: conditional(
      equal('fileType', raw('file')),
      'file.size',
      raw(0)
    ),

    isFileDistributionLoaded: conditional(
      equal('fileType', raw('file')),
      'fileDistributionModelProxy.content',
      // directories does not have file distribution
      raw(false),
    ),

    isFileDistributionLoading: and(
      'fileDistributionModelProxy.isPending',
      not('isFileDistributionLoaded')
    ),

    isFileDistributionError: reads('fileDistributionModelProxy.isRejected'),

    fileDistributionErrorReason: reads('fileDistributionModelProxy.reason'),

    fileDistribution: reads('fileDistributionModel.distributionPerProvider'),

    activeTransfers: reads('transfers.ongoing'),

    endedTransfersCount: reads('transfers.ended'),

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
        set(dataUpdater, 'interval', pollingTime);
      }
    }),

    init() {
      this._super(...arguments);

      const dataUpdater = Looper.create({
        immediate: true,
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
      if (this.get('file.type') === 'file') {
        return this.get('file').belongsTo('distribution').reload();
      } else {
        return resolve();
      }
    },

    /**
     * Returns Promise, which resolves to object:
     * ```
     * {
     *   ongoing: Array<Models.Transfer>,
     *   ended: number,
     *   endedOverflow: boolean, // true if ended transfers number is
     *     (potentially) greater than backend listing limit
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
      } = this.getProperties('file', 'transferManager', 'onedataConnection');
      const transfersHistoryLimitPerFile =
        get(onedataConnection, 'transfersHistoryLimitPerFile');
      
      return transferManager.getTransfersForFile(file, 'count').then(data =>
        Promise.all(data.ongoing.map(transferId =>
          transferManager.getTransfer(transferId)
        )).then(transfers =>
          Object.assign({}, data, {
            ongoing: transfers,
            endedOverflow: get(data, 'ended') >= transfersHistoryLimitPerFile,
          })
        )
      );
    },

    /**
     * @returns {Promise}
     */
    updateData() {
      const fileType = this.get('fileType');
      return Promise.all([
        fileType === 'file' ? this.updateFileDistributionModelProxy({ replace: true }) : resolve(),
        this.updateTransfersProxy({ replace: true }),
      ]);
    },

    getDistributionForOneprovider(oneprovider) {
      const {
        isFileDistributionLoaded,
        fileDistribution,
      } = this.getProperties('isFileDistributionLoaded', 'fileDistribution');
      if (isFileDistributionLoaded) {
        return get(fileDistribution, get(oneprovider, 'entityId'));
      } else {
        return {};
      }
    },
  }
);
