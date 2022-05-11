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
import { or, raw, getBy, tag, collect, conditional } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import {
  CopyDatasetId,
  CreateArchive,
  ChangeState,
  Remove,
} from 'oneprovider-gui/utils/dataset/actions';

/**
 * @typedef {'notEstablished'|'attached'|'detached'} DirectDatasetControlStatus
 */

export default Component.extend(I18n, {
  classNames: ['direct-dataset-control', 'alert'],
  classNameBindings: ['alertClass'],

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
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: undefined,

  /**
   * @virtual
   * @type {(dataset: Utils.BrowsableDataset) => void}
   */
  onOpenCreateArchive: notImplementedThrow,

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

  alertClassMapping: Object.freeze({
    notEstablished: 'alert-light',
    attached: 'alert-info',
    detached: 'alert-warning',
  }),

  statusIconMapping: Object.freeze({
    notEstablished: 'browser-info',
    attached: 'checkbox-filled',
    detached: 'plug-out',
  }),

  alertClass: or(
    getBy('alertClassMapping', 'status'),
    raw('alert-light'),
  ),

  statusIcon: or(
    getBy('statusIconMapping', 'status'),
    raw('x'),
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

  statusTip: conditional(
    equal('status', 'detached'),
    computed(function statusTip() {
      const fileTypeText = this.t(`fileType.${this.get('file.type')}`);
      return this.t('statusTip.detached', {
        fileType: fileTypeText,
      });
    }),
    raw(null),
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  establishButtonDisabledTip: computed(
    'spacePrivileges.manageDatasets',
    function insufficientEditPrivilegesMessage() {
      if (this.get('spacePrivileges.manageDatasets')) {
        return null;
      }
      return insufficientPrivilegesMessage({
        i18n: this.get('i18n'),
        modelName: 'space',
        privilegeFlag: 'space_manage_datasets',
      });
    }
  ),

  // FIXME: remove redundancy with dataset-browser-model
  // FIXME: i18n

  btnCopyId: computed('directDataset', function btnCopyId() {
    const directDataset = this.get('directDataset');
    if (!directDataset) {
      return;
    }
    return CopyDatasetId.create({
      ownerSource: this,
      context: {
        selectedItems: [directDataset],
      },
    });
  }),

  btnCreateArchive: computed(
    'directDataset',
    'onOpenCreateArchive',
    'spacePrivileges',
    function btnCreateArchive() {
      const {
        directDataset,
        onOpenCreateArchive,
        spacePrivileges,
      } = this.getProperties(
        'directDataset',
        'onOpenCreateArchive',
        'spacePrivileges',
      );
      if (!directDataset) {
        return;
      }
      return CreateArchive.create({
        ownerSource: this,
        onOpenCreateArchive,
        spacePrivileges,
        context: {
          selectedItems: [directDataset],
        },
      });
    }
  ),

  // FIXME: refactor actions create - function here or factory

  btnChangeState: computed(
    'directDataset',
    'spacePrivileges',
    function btnChangeState() {
      const {
        directDataset,
        spacePrivileges,
      } = this.getProperties(
        'directDataset',
        'spacePrivileges',
      );
      if (!directDataset) {
        return;
      }
      return ChangeState.create({
        ownerSource: this,
        spacePrivileges,
        context: {
          selectedItems: [directDataset],
        },
      });
    }
  ),

  btnRemove: computed('directDataset',
    'spacePrivileges',
    function btnRemove() {
      const {
        directDataset,
        spacePrivileges,
      } = this.getProperties(
        'directDataset',
        'spacePrivileges',
      );
      if (!directDataset) {
        return;
      }
      return Remove.create({
        ownerSource: this,
        spacePrivileges,
        context: {
          selectedItems: [directDataset],
        },
      });
    }
  ),

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
