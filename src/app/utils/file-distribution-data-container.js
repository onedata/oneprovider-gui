import EmberObject, { get, set, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve, Promise } from 'rsvp';
import { conditional, equal, raw, gt } from 'ember-awesome-macros';
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

    isFileDistributionModelLoaded: conditional(
      equal('fileType', raw('file')),
      'fileDistributionModelProxy.isFulfilled',
      // directories does not have file distribution
      raw(false),
    ),

    fileDistribution: reads('fileDistributionModel.distribution'),

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
        return get(this.get('file'), 'fileDistribution');
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
          transferManager.getTransfer(transferId).then(transfer =>
            get(transfer, 'currentStat').then(() => transfer)
          )
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
        fileType === 'file' ? this.updateFileDistributionModelProxy() : resolve(),
        this.updateTransfersProxy(),
      ]);
    },

    getDistributionForOneprovider(oneprovider) {
      const {
        isFileDistributionModelLoaded,
        fileDistribution,
      } = this.getProperties('isFileDistributionModelLoaded', 'fileDistribution');
      if (isFileDistributionModelLoaded) {
        return get(fileDistribution, get(oneprovider, 'entityId'));
      } else {
        return {};
      }
    },
  }
);
