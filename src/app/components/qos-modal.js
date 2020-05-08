/**
 * Modal for viewing and editing QoS entries for file
 * 
 * @module components/qos-modal
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { get, observer } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { conditional, raw, array, equal } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled } from 'rsvp';
import Looper from 'onedata-gui-common/utils/looper';
import QosItem from 'oneprovider-gui/utils/qos-item';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

const updateInterval = 5000;

export default Component.extend(
  I18n,
  createDataProxyMixin('fileQosSummary'),
  createDataProxyMixin('qosRecords'),
  createDataProxyMixin('qosItems'), {
    qosManager: service(),
    globalNotify: service(),
    store: service(),

    /**
     * @override
     */
    i18nPrefix: 'components.qosModal',

    /**
     * @virtual
     * @type {boolean}
     */
    open: false,

    /**
     * @virtual
     * Files for which the modal have been opened
     * @type {Array<Models.File>}
     */
    files: undefined,

    /**
     * @virtual
     * @type {Function}
     */
    onHide: notImplementedIgnore,

    /**
     * @virtual
     * @type {Function}
     */
    getDataUrl: notImplementedReject,

    /**
     * If modal is opened - interval in ms to auto update data
     * @type {Number}
     */
    updateInterval,

    /**
     * Initialized in init
     * @type {Looper}
     */
    updater: null,

    /**
     * One of: show (show list of QoS requirements for file), add (form)
     * @type {String}
     */
    mode: 'show',

    /**
     * @type {Object}
     */
    newEntryData: undefined,

    /**
     * Shorthand when exactly one file is opened
     * @type {Models.File|null}
     */
    file: conditional('multipleFiles', null, 'files.firstObject'),

    /**
     * @type {ComputedProperty<Boolean>}
     */
    multipleFiles: gt('files.length', 1),

    /**
     * @type {ComputedProperty<booelan>}
     */
    isAddMode: equal('mode', raw('add')),

    /**
     * @type {ComputedProperty<string>} one of: file, dir
     */
    fileType: reads('file.type'),

    isFileQosSummaryFulfilled: reads('fileQosSummaryProxy.fulfilled'),

    fileQosStatus: conditional(
      'isFileQosSummaryFulfilled',
      raw('fulfilled'),
      raw('pending'),
    ),

    fileQosStatusText: conditional(
      'isFileQosSummaryFulfilled',
      computedT('status.fulfilled'),
      computedT('status.pending'),
    ),

    fileQosStatusIcon: conditional(
      'isFileQosSummaryFulfilled',
      raw('checkbox-filled'),
      raw('checkbox-pending'),
    ),

    sortedQosItems: array.sort('qosItemsProxy.content', ['direct:desc']),

    configureUpdater: observer(
      'open',
      'updater',
      'updateInterval',
      function configureUpdater() {
        const {
          open,
          updateInterval,
        } = this.getProperties('open', 'updateInterval');
        this.set('updater.interval', open ? updateInterval : null);
      }
    ),

    isAnyEntryObserver: observer(
      'qosItems.length',
      'qosItemsProxy.isFulfilled',
      function isAnyEntryObserver() {
        if (this.get('qosItemsProxy.isFulfilled') && !this.get('qosItems.length')) {
          this.set('mode', 'add');
        }
      }),

    init() {
      this._super(...arguments);
      const updater = Looper.create({
        immediate: false,
      });
      updater.on('tick', () => {
        this.updateData(true);
      });
      this.set('updater', updater);
      this.configureUpdater();
    },

    willDestroyElement() {
      try {
        const updater = this.get('updater');
        if (updater) {
          updater.destroy();
        }
      } finally {
        this._super(...arguments);
      }
    },

    /**
     * @override
     */
    fetchQosItems() {
      const {
        qosRecordsProxy,
        file,
        fileQosSummary,
      } = this.getProperties('qosRecordsProxy', 'file', 'fileQosSummary');
      return qosRecordsProxy.then(qosRecords =>
        allFulfilled(qosRecords.map(qos => get(qos, 'file').then(qosSourceFile =>
          QosItem.create({
            modalFileId: get(file, 'entityId'),
            qosSourceFile,
            fileQosSummary,
            qos,
          })
        )))
      );
    },

    /**
     * @override
     */
    fetchFileQosSummary() {
      const {
        store,
        file,
      } = this.getProperties('store', 'file');
      const fileQosSummaryGri = file.belongsTo('fileQos').id();
      // in case, there were error when fetching the relation last time (eg. forbidden)
      const prePromise = fileQosSummaryGri ?
        resolve(fileQosSummaryGri) :
        file.reload().then(file => file.belongsTo('fileQos').id());
      return prePromise
        .then(gri => store.findRecord('fileQosSummary', gri, { reload: true }));
    },

    /**
     * @override
     */
    fetchQosRecords(replace) {
      // NOTE: not need to update qos records separately
      // in this modal, because their fulfilled property
      // is not used (using per-file map in fileQosSummary)
      return this.updateFileQosSummaryProxy({ replace }).then(fileQosSummary =>
        fileQosSummary.updateQosRecordsProxy({ replace: true })
      );
    },

    onShow() {
      this.updateQosItemsProxy()
        .catch(() => {
          safeExec(this, 'set', 'updater.interval', null);
        });
    },

    updateData(replace) {
      const file = this.get('file');
      return this.updateQosRecordsProxy({ replace, fetchArgs: [replace] })
        .then(() => this.updateQosItemsProxy({ replace }))
        .then(() => file.reload())
        .catch(() => {
          safeExec(this, 'set', 'updater.interval', null);
        });
    },

    addEntry({ replicasNumber, expressionInfix }) {
      const {
        file,
        qosManager,
        globalNotify,
      } = this.getProperties('file', 'qosManager', 'globalNotify');
      return qosManager.createQos(file, expressionInfix, replicasNumber)
        .catch((error) => {
          globalNotify.backendError(this.t('addingQosEntry'), error);
          throw error;
        })
        .then(() => {
          const updating = this.updateData();
          this.set('mode', 'show');
          return updating;
        });
    },

    actions: {
      onShow() {
        this.onShow();
      },
      onHide() {
        this.get('onHide')();
      },
      changeNewEntry(data, isValid) {
        this.setProperties({
          newEntryData: data,
          newEntryIsValid: isValid,
        });
      },
      save() {
        return this.addEntry(this.get('newEntryData'));
      },
      removeQos(qos) {
        return this.get('qosManager').removeQos(qos)
          .finally(() => {
            this.updateData();
          });
      },
      getDataUrl({ fileId }) {
        return this.get('getDataUrl')({ fileId });
      },
    },
  }
);
