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
import { get, observer, computed } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { conditional, raw, equal, and, getBy, array } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { all as allFulfilled, allSettled } from 'rsvp';
import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import QosModalFileItem from 'oneprovider-gui/utils/qos-modal-file-item';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

export const qosStatusIcons = {
  error: 'warning',
  empty: 'circle-not-available',
  fulfilled: 'checkbox-filled',
  pending: 'checkbox-pending',
  impossible: 'checkbox-filled-warning',
};

export default Component.extend(I18n, {
  qosManager: service(),
  fileManager: service(),
  globalNotify: service(),
  i18n: service(),
  spaceManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal',

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

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
   * @virtual optional
   * @type {Boolean}
   */
  showPrivilege: true,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  editPrivilege: true,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedReject,

  /**
   * If modal is opened - interval in ms to auto update data
   * @type {Number}
   */
  updateInterval: conditional('open', raw(5000), null),

  /**
   * Initialized in init
   * @type {Looper}
   */
  updater: null,

  /**
   * One of: show (show list of QoS requirements for file), add (form)
   * @type {String}
   */
  // FIXME: development value
  mode: 'show',

  /**
   * Object containing data required to create neq Models.QosRequirement
   * @type { { replicasNumber: Number, expressionInfix: Array<String> } }
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
  isAddMode: and('editPrivilege', equal('mode', raw('add'))),

  /**
   * @type {ComputedProperty<string>} one of: file, dir
   */
  fileType: reads('file.type'),

  /**
   * @type {Array<String>}
   */
  filesStatus: array.mapBy('fileItems', raw('fileQosStatus')),

  noEditHint: computed(function noEditHint() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_manage_qos',
    });
  }),

  fileItems: computed('files.[]', function fileItems() {
    const filesSorted = [...this.get('files')].sortBy('name');
    return filesSorted.map(file => {
      return QosModalFileItem.create({
        file,
      });
    });
  }),

  fileTypeText: computed('multipleFiles', 'file.type', function fileTypeText() {
    const key = this.get('multipleFiles') ? 'multi' : this.get('file.type');
    return this.t('fileType.' + key);
  }),

  /**
   * One of: error, loading, pending, impossible, fulfilled, unknown
   * @type {ComputedProperty<String>}
   */
  allQosStatus: computed('filesStatus.[]', function allQosStatus() {
    const filesStatus = this.get('filesStatus');
    for (const status of ['error', 'loading', 'pending', 'impossible', 'fulfilled']) {
      if (filesStatus.includes(status)) {
        return status;
      }
    }
    return 'unknown';
  }),

  allQosStatusIcon: getBy(raw(qosStatusIcons), 'allQosStatus'),

  configureUpdater: observer(
    'updater',
    'updateInterval',
    function configureUpdater() {
      this.set('updater.interval', this.get('updateInterval'));
    }
  ),

  init() {
    this._super(...arguments);
    this.initUpdater();
    this.addObserver('qosItemsProxy', () => {
      console.log('FIXME: qosItems updated');
    });
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

  evaluateQosExpression(expression) {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.evaluateQosExpression(spaceId, expression);
  },

  initUpdater() {
    const updater = Looper.create({
      immediate: true,
    });
    updater.on('tick', () => {
      this.updateData(true);
    });
    this.set('updater', updater);
    this.configureUpdater();
  },

  async updateData(replace = false) {
    const fileItems = this.get('fileItems');
    try {
      await allFulfilled(fileItems.invoke('updateQosItemsProxy', { replace }));
      await allFulfilled(fileItems.mapBy('file').invoke('reload'));
    } catch (error) {
      safeExec(this, 'set', 'updater.interval', null);
    }
  },

  addEntry({ replicasNumber, expressionInfix }) {
    const {
      fileItems,
      qosManager,
      fileManager,
      globalNotify,
    } = this.getProperties('fileItems', 'qosManager', 'fileManager', 'globalNotify');
    return allSettled(fileItems.map(fileItem => {
        const file = get(fileItem, 'file');
        return qosManager.createQosRequirement(file, expressionInfix, replicasNumber)
          .finally(() => {
            if (get(file, 'type') === 'dir') {
              return fileManager.dirChildrenRefresh(get(file, 'entityId'));
            }
          });
      }))
      .then(results => {
        const rejectedResult = results.findBy('state', 'rejected');
        if (rejectedResult) {
          globalNotify.backendError(this.t('addingQosEntry'), rejectedResult.reason);
          this.updateData();
          throw rejectedResult.reason;
        }
      })
      // just in case if code fails
      .catch(error => {
        globalNotify.backendError(this.t('addingQosEntry'), error);
        this.updateData();
        throw error;
      })
      .then(() => {
        const updating = this.updateData();
        safeExec(this, 'set', 'mode', 'show');
        return updating;
      });
  },

  actions: {
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
    removeQosRequirement(qosRequirement) {
      const {
        qosManager,
        fileManager,
      } = this.getProperties('qosManager', 'fileManager');
      return get(qosRequirement, 'file').then(file => {
        return qosManager.removeQosRequirement(qosRequirement)
          .finally(() => {
            this.updateData();
            if (get(file, 'type') === 'dir') {
              return fileManager.dirChildrenRefresh(get(file, 'entityId'));
            }
          });
      });
    },
    getDataUrl() {
      return this.get('getDataUrl')(...arguments);
    },
    evaluateQosExpression(expression) {
      return this.evaluateQosExpression(expression);
    },
  },
});
