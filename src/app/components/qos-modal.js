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
import EmberObject, { get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, array, getBy, equal } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { all as allFulfilled } from 'rsvp';
import Looper from 'onedata-gui-common/utils/looper';

const updateInterval = 5000;

const QosItem = EmberObject.extend({
  modalFileId: undefined,
  qos: undefined,
  file: undefined,
  fileQos: undefined,

  entityId: reads('qos.entityId'),
  fulfilled: reads('qos.fulfilled'),
  replicasNum: reads('qos.replicasNum'),
  expression: reads('qos.expression'),

  direct: equal('modalFileId', 'file.entityId'),
  fileFulfilled: conditional(
    'direct',
    getBy('fileQos.qosEntries', 'qos.entityId'),
    null,
  ),
});

export default Component.extend(
  I18n,
  createDataProxyMixin('fileQos'),
  createDataProxyMixin('qosRecords'),
  createDataProxyMixin('qosItems'), {
    qosManager: service(),
    globalNotify: service(),

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
     * @type {Models.File}
     */
    file: undefined,

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
     * @type {boolean}
     * If true, add entry is expanded
     */
    addNewEntryActive: false,

    /**
     * Initialized in init
     * @type {Looper}
     */
    updater: null,

    /**
     * @type {ComputedProperty<string>} one of: file, dir
     */
    fileType: reads('file.type'),

    isFileQosFulfilled: reads('fileQosProxy.fulfilled'),

    fileQosStatus: conditional(
      'isFileQosFulfilled',
      raw('fulfilled'),
      raw('pending'),
    ),

    fileQosStatusText: conditional(
      'isFileQosFulfilled',
      computedT('status.fulfilled'),
      computedT('status.pending'),
    ),

    fileQosStatusIcon: conditional(
      'isFileQosFulfilled',
      raw('checkbox-filled'),
      raw('checkbox-pending'),
    ),

    sortedQosItems: array.sort('qosItemsProxy.content', ['direct']),

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

    init() {
      this._super(...arguments);
      const updater = Looper.create({
        immediate: false,
      });
      updater.on('tick', () => {
        this.updateData({ replace: true });
      });
      this.set('updater', updater);
      this.configureUpdater();
    },

    /**
     * @override
     */
    fetchQosItems() {
      const {
        qosRecordsProxy,
        file,
        fileQos,
      } = this.getProperties('qosRecordsProxy', 'file', 'fileQos');
      return qosRecordsProxy.then(qosRecords =>
        allFulfilled(qosRecords.map(qos => get(qos, 'file').then(qosFile =>
          QosItem.create({
            modalFileId: get(file, 'entityId'),
            file: qosFile,
            fileQos,
            qos,
          })
        )))
      );
    },

    /**
     * @override
     */
    fetchFileQos() {
      return this.get('file').belongsTo('fileQos').reload();
    },

    /**
     * @override
     */
    fetchQosRecords() {
      // NOTE: not need to update qos records separately
      // in this modal, because their fulfilled property
      // is not used (using per-file map in fileQos)
      return this.updateFileQosProxy().then(fileQos =>
        fileQos.updateQosRecordsProxy({ replace: true })
      );
    },

    onShow() {
      this.updateQosItemsProxy();
    },

    updateData(updateOptions) {
      const file = this.get('file');
      return this.updateQosRecordsProxy(updateOptions)
        .finally(() => this.updateQosItemsProxy(updateOptions))
        .finally(() => file.reload());
    },

    addEntry({ replicasNumber, expression }) {
      const {
        file,
        qosManager,
        globalNotify,
      } = this.getProperties('file', 'qosManager', 'globalNotify');
      return qosManager.createQos(file, expression, replicasNumber)
        .catch((error) => {
          globalNotify.backendError(this.t('addingQosEntry'), error);
          throw error;
        })
        .then(() => {
          return this.updateData();
        });
    },

    actions: {
      onShow() {
        this.onShow();
      },
      onHide() {
        this.get('onHide')();
      },
      addEntry(data) {
        return this.addEntry(data);
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
