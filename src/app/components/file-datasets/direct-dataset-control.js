/**
 * Control of dataset estabilished directly for some file/directory
 *
 * @module components/file-dataset/direct-dataset-control
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { equal, reads } from '@ember/object/computed';
import { or, raw, getBy, tag, collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

/**
 * @typedef {'notEstablished'|'attached'|'detached'} DirectDatasetControlStatus
 */

export default Component.extend(I18n, {
  classNames: ['direct-dataset-control'],

  datasetManager: service(),
  globalNotify: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.directDatasetControl',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {PromiseObject<Models.Dataset>}
   */
  directDatasetProxy: undefined,

  /**
   * @virtual
   * @type {() => Promise<void>}
   */
  onEstablishDirectDataset: notImplementedReject,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {SafeString}
   */
  readonlyMessage: undefined,

  //#region state

  /**
   * @type {boolean}
   */
  areActionsOpened: false,

  //#endregion

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  directDataset: reads('directDatasetProxy.content'),

  /**
   * Valid only if `directDatasetProxy` resolves
   * @type {ComputedProperty<Boolean>}
   */
  isDatasetAttached: equal('directDataset.state', 'attached'),

  /**
   * @type {ComputedProperty<DirectDatasetControlStatus>}
   */
  status: or(
    'directDataset.state',
    raw('notEstablished'),
  ),

  statusIconMapping: Object.freeze({
    notEstablished: 'browser-info',
    attached: 'checkbox-filled',
    detached: 'plug-out',
  }),

  statusIconClassMapping: Object.freeze({
    notEstablished: '',
    attached: 'text-success',
    detached: 'text-warning',
  }),

  statusIcon: or(
    getBy('statusIconMapping', 'status'),
    raw('x'),
  ),

  statusIconClass: or(
    getBy('statusIconClassMapping', 'status'),
    raw(''),
  ),

  /**
   * @type {SafeString}
   */
  statusText: computed(
    'status',
    'file.type',
    'directDataset.creationTime',
    function statusText() {
      const status = this.get('status');
      const fileType = this.get('file.type');
      const creationTime = this.get('directDataset.creationTime');
      const fileTypeText = this.t(`fileType.${fileType}`);
      const creationTimeText = dateFormat([creationTime], {
        format: 'dateWithMinutes',
        blank: '—',
      });
      return this.t(`statusText.${status}`, {
        fileType: fileTypeText,
        creationTime: creationTimeText,
      }, {
        defaultValue: '',
      });
    }
  ),

  // FIXME: remove redundancy with dataset-browser-model
  // FIXME: i18n

  btnCopyId: computed(function btnCopyId() {
    return {
      className: 'copy-dataset-id',
      icon: 'circle-id',
      title: 'Copy dataset ID',
    };
  }),

  btnCreateArchive: computed(function btnCreateArchive() {
    return {
      className: 'create-archive',
      icon: 'browser-archive-add',
      title: 'Create archive',
    };
  }),

  btnChangeState: computed('directDataset.state', function btnChangeState() {
    const isAttachAction = this.get('directDataset.state') !== 'attached';
    return {
      className: 'changeState',
      icon: isAttachAction ? 'plug-in' : 'plug-out',
      title: isAttachAction ? 'Reattach' : 'Detach',
    };
  }),

  btnRemove: computed(function btnRemove() {
    return {
      id: 'remove',
      icon: 'browser-delete',
      title: 'Remove dataset',
    };
  }),

  /**
   * @type {Utils.Action}
   */
  directDatasetActions: collect(
    'btnCopyId',
    'btnCreateArchive',
    'btnChangeState',
    'btnRemove',
  ),

  actionsTriggerClass: 'direct-dataset-actions-trigger',

  actionsTriggerSelector: tag `#${'elementId'} .${'actionsTriggerClass'} .menu-trigger-arrow`,

  actions: {
    async establishDirectDataset() {
      return await this.get('onEstablishDirectDataset')();
    },
    toggleActionsOpen(state) {
      let effState = state;
      if (typeof effState !== 'boolean') {
        effState = !this.get('areActionsOpened');
      }
      effState = Boolean(effState);
      this.set('areActionsOpened', effState);
    },
  },
});
