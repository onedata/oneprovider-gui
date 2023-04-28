/**
 * Implementation of browser-model (logic and co-related data) for dataset-browser
 * (a browser for mananging datasets tree).
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { set, get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
import { conditional } from 'ember-awesome-macros';
import {
  CopyDatasetIdAction,
  CreateArchiveAction,
  ChangeStateAction,
  RemoveAction,
} from 'oneprovider-gui/utils/dataset/actions';
import { spaceDatasetsRootId } from 'oneprovider-gui/components/content-space-datasets';

const allButtonNames = Object.freeze([
  'btnRefresh',
  'btnCopyId',
  'btnShowFile',
  'btnCreateArchive',
  'btnProtection',
  'btnChangeState',
  'btnRemove',
]);

export default BaseBrowserModel.extend(I18n, {
  modalManager: service(),
  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.datasetBrowserModel',

  /**
   * State of space-datasets container for datasets-browser.
   * Properties:
   * - `attachmentState: String`
   * @virtual
   * @type {Object}
   */
  spaceDatasetsViewState: Object.freeze({}),

  /**
   * Set to true, to turn off archives view links.
   * @virtual
   */
  archivesLinkDisabled: false,

  /**
   * Function argument: data for getDataUrl Onezone function
   * @override
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @override
   * @type {(dataset: Models.Dataset, file: Models.File) => any}
   */
  openProtectionModal: notImplementedThrow,

  /**
   * @override
   * @type {(dataset: Models.Dataset) => any}
   */
  openCreateArchiveModal: notImplementedThrow,

  /**
   * @override
   * @type {(dataset: Models.Dataset) => any}
   */
  openArchivesView: notImplementedThrow,

  /**
   * @override
   */
  rowComponentName: 'dataset-browser/table-row',

  /**
   * @override
   */
  statusBarComponentName: 'dataset-browser/table-row-status-bar',

  /**
   * @override
   */
  mobileSecondaryInfoComponentName: 'dataset-browser/table-row-mobile-secondary-info',

  /**
   * @override
   */
  secondaryInfoComponentName: 'dataset-browser/table-row-secondary-info',

  /**
   * @override
   */
  columnsComponentName: 'dataset-browser/table-row-columns',

  /**
   * @override
   */
  headRowComponentName: 'dataset-browser/table-head-row',

  /**
   * @override
   */
  emptyDirComponentName: 'dataset-browser/empty-dir',

  /**
   * @override
   */
  browserClass: 'dataset-browser',

  /**
   * @override
   */
  currentDirTranslation: conditional(
    'dir.isDatasetsRoot',
    computedT('spaceDatasets'),
    computedT('currentDataset'),
  ),

  /**
   * @override
   */
  buttonNames: computed('attachmentState', function buttonNames() {
    if (this.get('attachmentState') === 'detached') {
      return _.without(
        allButtonNames,
        'btnCreateArchive',
        'btnProtection',
        'btnShowFile'
      );
    } else {
      return [...allButtonNames];
    }
  }),

  _window: window,

  navigateDataTarget: '_top',

  /**
   * One of: attached, detached.
   * Which state tree of datasets is displayed.
   * @type {ComputedProperty<String>}
   */
  attachmentState: reads('spaceDatasetsViewState.attachmentState').readOnly(),

  //#region Action buttons

  btnCopyId: computed(function btnCopyId() {
    return this.createFileAction(CopyDatasetIdAction);
  }),

  btnShowFile: computed('selectionContext', function btnShowFile() {
    const selectionContext = this.get('selectionContext');
    return this.createFileAction({
      id: 'showFile',
      icon: 'browser-' +
        (selectionContext === actionContext.singleFile ? 'file' : 'directory'),
      disabled: false,
      action: (datasets) => {
        return this.showRootFile(datasets[0]);
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
      ],
    });
  }),

  btnCreateArchive: computed('spacePrivileges', function btnCreateArchive() {
    const spacePrivileges = this.get('spacePrivileges');
    return this.createFileAction(CreateArchiveAction, {
      onOpenCreateArchive: this.openCreateArchiveModal.bind(this),
      spacePrivileges,
    });
  }),

  btnChangeState: computed(
    'attachmentState',
    function btnChangeState() {
      const {
        // use attachmentState from this component to prevent unnecessary action recompute
        attachmentState,
        spacePrivileges,
      } = this.getProperties(
        'attachmentState',
        'spacePrivileges',
      );
      /**
       * @type {ChangeStateAction}
       * @property {Models.Dataset} [currentDirParent] Additional property for base action
       *   used only if modifying current dir, contains parent of current dir to be
       *   redirected to after change.
       */
      const actionButton = this.createFileAction(ChangeStateAction, {
        attachmentState,
        spacePrivileges,
        onStateChanged: async (changedDatasets) => {
          if (changedDatasets?.includes(this.dir) && actionButton.currentDirParent) {
            await this.changeDir(actionButton.currentDirParent);
          } else {
            await this.refresh();
          }
        },
      });

      // override general toggle action to make additional operations for browser
      const originalAction = actionButton.action;
      set(actionButton, 'action', async (datasets) => {
        const currentDir = this.dir;
        const isChangingCurrentDirState = datasets.includes(currentDir);
        if (isChangingCurrentDirState) {
          actionButton.currentDirParent = await this.resolveFileParentFun(currentDir);
        }
        return originalAction(datasets);
      });
      return actionButton;
    }
  ),

  btnRemove: computed(function btnRemove() {
    const spacePrivileges = this.get('spacePrivileges');
    return this.createFileAction(RemoveAction, {
      spacePrivileges,
      onRemoved: this.refresh.bind(this),
    });
  }),

  btnProtection: computed(function btnProtection() {
    return this.createFileAction({
      id: 'protection',
      icon: 'browser-permissions',
      action: async (datasets) => {
        const globalNotify = this.get('globalNotify');
        const dataset = datasets[0];
        try {
          const rootFile = await get(dataset, 'rootFile');
          if (rootFile) {
            return this.openProtectionModal(dataset, rootFile);
          } else {
            globalNotify.backendError(this.t('protection.loadingRootFile'));
          }
        } catch (error) {
          globalNotify.backendError(
            this.t('protection.loadingRootFile'),
            error
          );
        }
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
      ],
    });
  }),

  //#endregion

  // TODO: VFS-10743 Currently not used, but this method may be helpful in not-known
  // items select implementation
  /**
   * @override
   */
  async checkItemExistsInParent(parentDatasetId, dataset) {
    const datasetId = get(dataset, 'entityId');
    try {
      const datasetRecord = await this.datasetManager
        .getDataset(datasetId, { reload: true });
      const datasetRecordParentId = datasetRecord.relationEntityId('parent');
      return datasetRecordParentId ?
        datasetRecordParentId === parentDatasetId :
        parentDatasetId === spaceDatasetsRootId;
    } catch {
      return false;
    }
  },

  /**
   * @override
   */
  onOpenFile( /* dataset */ ) {
    // ignore - file dataset cannot be opened
  },

  showRootFile(dataset) {
    const {
      _window,
      getDataUrl,
      navigateDataTarget,
    } = this.getProperties('_window', 'getDataUrl', 'navigateDataTarget');
    const fileId = dataset.relationEntityId('rootFile');
    const url = getDataUrl({ fileId: null, selected: [fileId] });
    return _window.open(url, navigateDataTarget);
  },
});
