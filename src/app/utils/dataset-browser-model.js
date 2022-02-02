/**
 * Implementation of browser-model (logic and co-related data) for dataset-browser
 * (a browser for mananging datasets tree).
 *
 * @module utils/dataset-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import {
  anySelectedContexts,
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { allSettled } from 'rsvp';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { conditional } from 'ember-awesome-macros';

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
  globalClipboard: service(),

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
  mobileInfoComponentName: 'dataset-browser/table-row-mobile-info',

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

  selectedDatasetsHaveArchives: computed(
    'selectedItems.@each.archiveCount',
    function selectedDatasetsHaveArchives() {
      return _.sum(this.get('selectedItems').mapBy('archiveCount')) > 0;
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedRootDeleted: computed(
    'attachmentState',
    'selectedItems.@each.rootFileDeleted',
    function isAnySelectedRootDeleted() {
      const {
        attachmentState,
        selectedItems,
      } = this.getProperties('attachmentState', 'selectedItems');
      return attachmentState === 'detached' && selectedItems.isAny('rootFileDeleted');
    }
  ),

  //#region Action buttons

  btnCopyId: computed(function btnCopyId() {
    return this.createFileAction({
      id: 'copyDatasetId',
      icon: 'circle-id',
      action: (datasets) => {
        const dataset = datasets[0];
        this.get('globalClipboard').copy(
          get(dataset, 'entityId'),
          this.t('datasetId')
        );
      },
      showIn: [
        actionContext.singleFile,
        actionContext.singleFilePreview,
        actionContext.singleDir,
        actionContext.singleDirPreview,
      ],
    });
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
        actionContext.currentDir,
      ],
    });
  }),

  btnCreateArchive: computed(
    'spacePrivileges.{manageDatasets,createArchives}',
    function btnCreateArchive() {
      const {
        spacePrivileges,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'i18n',
      );
      const hasPrivileges = spacePrivileges.manageDatasets &&
        spacePrivileges.createArchives;
      let disabledTip;
      if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_manage_datasets', 'space_create_archives'],
        });
      }
      return this.createFileAction({
        id: 'createArchive',
        icon: 'browser-archive-add',
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (datasets) => {
          return this.openCreateArchiveModal(datasets[0]);
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleFile,
          actionContext.currentDir,
        ],
      });
    }
  ),

  btnChangeState: computed(
    'attachmentState',
    'isAnySelectedRootDeleted',
    function btnChangeState() {
      const {
        attachmentState,
        isAnySelectedRootDeleted,
      } = this.getProperties('attachmentState', 'isAnySelectedRootDeleted');
      const isAttachAction = attachmentState === 'detached';
      const disabledTip = isAnySelectedRootDeleted ?
        this.t('actionHints.cannotReattachDeleted') : null;
      const disabled = Boolean(disabledTip);
      return this.createFileAction({
        id: 'showFile',
        icon: isAttachAction ? 'plug-in' : 'plug-out',
        disabled,
        tip: disabledTip,
        title: this.t(
          `fileActions.changeState.${isAttachAction ? 'attach' : 'detach'}`
        ),
        action: (datasets) => {
          return this.askForToggleAttachment(
            datasets,
            isAttachAction ? 'attached' : 'detached'
          );
        },
        showIn: [
          ...anySelectedContexts,
        ],
      });
    }
  ),

  btnRemove: computed(
    'areMultipleSelected',
    'selectedDatasetsHaveArchives',
    function btnRemove() {
      const {
        areMultipleSelected,
        selectedDatasetsHaveArchives,
      } =
      this.getProperties(
        'areMultipleSelected',
        'selectedDatasetsHaveArchives',
      );
      let disabledTip;
      if (selectedDatasetsHaveArchives) {
        disabledTip = this.t('notAvailableHaveArchives');
      }
      return this.createFileAction({
        id: 'remove',
        icon: 'browser-delete',
        title: this.t(`fileActions.remove.${areMultipleSelected ? 'multi' : 'single'}`),
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (datasets) => {
          return this.askForRemoveDatasets(datasets);
        },
        showIn: [
          ...anySelectedContexts,
        ],
      });
    }
  ),

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

  askForToggleAttachment(datasets, targetState) {
    const {
      modalManager,
      globalNotify,
    } = this.getProperties('modalManager', 'globalNotify');
    const count = get(datasets, 'length');
    const attach = targetState === 'attached';
    const actionName = (attach ? 'attach' : 'detach');
    const isMulti = count > 1;
    const pluralType = isMulti ? 'multi' : 'single';
    const descriptionKey = `toggleDatasetAttachment.intro.${actionName}.${pluralType}`;
    let descriptionInterpolation;
    if (isMulti) {
      descriptionInterpolation = {
        count,
      };
    } else {
      descriptionInterpolation = {
        name: get(datasets[0], 'name'),
        path: get(datasets[0], 'rootFilePath'),
        fileType: this.t('fileType.' + get(datasets[0], 'rootFileType')),
      };
    }
    const introText = this.t(descriptionKey, descriptionInterpolation);
    return modalManager.show('question-modal', {
        headerIcon: attach ? 'sign-info-rounded' : 'sign-warning-rounded',
        headerText: this.t(
          `toggleDatasetAttachment.header.${pluralType}.${actionName}`
        ),
        descriptionParagraphs: [{
          text: introText,
        }, {
          text: this.t('toggleDatasetAttachment.proceedQuestion'),
        }],
        yesButtonText: this.t('toggleDatasetAttachment.yes'),
        yesButtonType: attach ? 'primary' : 'danger',
        onSubmit: async () => {
          const submitResult = await this.toggleDatasetsAttachment(datasets, attach);
          const firstRejected = submitResult.findBy('state', 'rejected');
          if (firstRejected) {
            const error = get(firstRejected, 'reason');
            globalNotify.backendError(
              this.t('toggleDatasetAttachment.changingState'),
              error
            );
            throw error;
          }
          return submitResult;
        },
      }).hiddenPromise
      .then(() => {
        // TODO: VFS-7632 show modal with to links to moved datasets after attach/detach
      });
  },

  askForRemoveDatasets(datasets) {
    const {
      modalManager,
      globalNotify,
    } = this.getProperties('modalManager', 'globalNotify');
    const count = get(datasets, 'length');
    const isMulti = count > 1;
    const descriptionKey = `remove.description.${isMulti ? 'multi' : 'single'}`;
    let descriptionInterpolation;
    if (isMulti) {
      descriptionInterpolation = {
        count,
      };
    } else {
      descriptionInterpolation = {
        name: get(datasets, 'firstObject.name'),
      };
    }
    return modalManager.show('question-modal', {
      headerIcon: 'sign-warning-rounded',
      headerText: this.t('remove.header.' + (isMulti ? 'multi' : 'single')),
      descriptionParagraphs: [{
        text: this.t(descriptionKey, descriptionInterpolation),
      }, {
        text: this.t('remove.proceedQuestion'),
      }],
      yesButtonText: this.t('remove.yes'),
      yesButtonType: 'danger',
      onSubmit: async () => {
        const submitResult = await this.removeDatasets(datasets);
        const firstRejected = submitResult.findBy('state', 'rejected');
        if (firstRejected) {
          const error = get(firstRejected, 'reason');
          globalNotify.backendError(
            this.t('remove.removing'),
            error
          );
          throw error;
        }
        return submitResult;
      },
    }).hiddenPromise;
  },

  async toggleDatasetsAttachment(datasets, attach) {
    const datasetManager = this.get('datasetManager');
    const result = await allSettled(datasets.map(dataset =>
      datasetManager.toggleDatasetAttachment(dataset, attach)
    ));
    try {
      await this.refresh();
    } catch (error) {
      console.error(
        'util:dataset-browser-model#toggleDatasetsAttachment: refreshing browser after toggling attachment failed:',
        error
      );
    }
    return result;
  },

  async removeDatasets(datasets) {
    const datasetManager = this.get('datasetManager');
    const result = await allSettled(datasets.map(dataset =>
      datasetManager.destroyDataset(dataset)
    ));
    try {
      await this.refresh();
    } catch (error) {
      console.error(
        'util:dataset-browser-model#toggleDatasetsAttachment: refreshing browser after removing datasets failed:',
        error
      );
    }
    return result;
  },
});
