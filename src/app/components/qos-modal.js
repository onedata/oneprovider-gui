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
import { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, equal, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';

export default Component.extend(
  I18n,
  createDataProxyMixin('fileQos'),
  createDataProxyMixin('qosRecords'), {
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
     * @type {ComputedProperty<string>} one of: file, dir
     */
    fileType: reads('file.type'),

    isFileQosFulfilled: reads('fileQosProxy.fulfilled'),

    /**
     * @type {ComputedProperty<string>}
     */
    typeTranslation: conditional(
      equal('fileType', raw('file')),
      computedT('fileType.file'),
      computedT('fileType.dir'),
    ),

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

    fileQosStatusClass: conditional(
      'isFileQosFulfilled',
      raw('success'),
      raw('default'),
    ),

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
      return this.updateFileQosProxy().then(fileQos =>
        fileQos.updateQosRecordsProxy({ replace: true })
      );
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
          return this.updateQosRecordsProxy();
        });
    },

    actions: {
      onShow() {
        this.updateQosRecordsProxy().then(qosRecords => {
          if (!get(qosRecords, 'length')) {
            this.set('addNewEntryActive', true);
          }
        });
      },
      onHide() {
        this.get('onHide')();
      },
      addEntry(data) {
        return this.addEntry(data);
      },
    },
  }
);
