// FIXME: jsdoc

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import { hash } from 'ember-awesome-macros';
import {
  anySelectedContexts,
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { all as allFulfilled } from 'rsvp';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const buttonNames = Object.freeze([
  'btnRefresh',
  'btnShowFile',
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
   * Function argument: data for getDataUrl Onezone function
   * @override
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @override
   * @type {Function} arguments: `dataset: Models.Dataset`
   */
  openDatasetOpenModal: notImplementedThrow,

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
  headColumnsComponentName: 'dataset-browser/table-head-columns',

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
  currentDirTranslation: computedT('currentDataset'),

  /**
   * @override
   */
  allButtonsHash: hash(...buttonNames),

  /**
   * One of: attached, detached.
   * Which state tree of datasets is displayed.
   * @virtual
   * @type {String}
   */
  attachmentState: undefined,

  _window: window,

  navigateDataTarget: '_top',

  //#region Action buttons

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

  btnChangeState: computed('attachmentState', function btnChangeState() {
    const attachmentState = this.get('attachmentState');
    const isAttachAction = attachmentState === 'detached';
    return this.createFileAction({
      id: 'showFile',
      icon: isAttachAction ? 'plug-in' : 'plug-out',
      title: this.t(
        'fileActions.changeState.' + (isAttachAction ? 'attach' : 'detach')
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
  }),

  btnRemove: computed(function btnRemove() {
    return this.createFileAction({
      id: 'remove',
      icon: 'browser-delete',
      action: (datasets) => {
        return this.askForRemoveDatasets(datasets);
      },
      showIn: [
        ...anySelectedContexts,
      ],
    });
  }),

  btnProtection: computed(function btnProtection() {
    return this.createFileAction({
      id: 'protection',
      icon: 'browser-permissions',
      action: async (datasets) => {
        try {
          const rootFile = await get(datasets[0], 'rootFile');
          return this.openDatasetsModal(rootFile);
        } catch (error) {
          this.get('globalNotify').backendError(
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
  onOpenFile(dataset) {
    this.get('openDatasetOpenModal')(dataset);
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
    const pluralType = count > 1 ? 'multi' : 'single';
    let introText;
    if (count > 1) {
      introText = this.t('toggleDatasetAttachment.introMulti.' + actionName, {
        count,
      });
    } else {
      introText = this.t(
        'toggleDatasetAttachment.introSingle.' + actionName, {
          name: get(datasets[0], 'name'),
          path: get(datasets[0], 'rootFilePath'),
          fileType: this.t('fileType.' + get(datasets[0], 'rootFileType')),
        }
      );
    }
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
        yesButtonClassName: attach ? 'btn-primary' : 'btn-danger',
        onSubmit: async () => {
          try {
            return await this.toggleDatasetsAttachment(datasets, attach);
          } catch (error) {
            globalNotify.backendError(
              this.t('toggleDatasetAttachment.changingState'),
              error
            );
            throw error;
          }
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
    const descriptionInterpolation = {};
    const count = get(datasets, 'length');
    if (count > 1) {
      descriptionInterpolation.selectedText = this.t('remove.selectedText.multi', {
        count,
      });
    } else {
      descriptionInterpolation.selectedText = this.t('remove.selectedText.single', {
        name: get(datasets, 'firstObject.name'),
      });
    }
    return modalManager.show('question-modal', {
      headerIcon: 'sign-warning-rounded',
      headerText: this.t('remove.header.' + (count > 1 ? 'multi' : 'single')),
      descriptionParagraphs: [{
        text: this.t('remove.description', descriptionInterpolation),
      }, {
        text: this.t('remove.proceedQuestion'),
      }],
      yesButtonText: this.t('remove.yes'),
      yesButtonClassName: 'btn-danger',
      onSubmit: async () => {
        try {
          return await this.removeDatasets(datasets);
        } catch (error) {
          globalNotify.backendError(
            this.t('remove.removing'),
            error
          );
          throw error;
        }
      },
    }).hiddenPromise;
  },

  async toggleDatasetsAttachment(datasets, attach) {
    const datasetManager = this.get('datasetManager');
    try {
      await allFulfilled(datasets.map(dataset =>
        datasetManager.toggleDatasetAttachment(dataset, attach)
      ));
    } finally {
      await this.refresh();
    }
  },

  async removeDatasets(datasets) {
    const datasetManager = this.get('datasetManager');
    try {
      return allFulfilled(datasets.map(dataset =>
        datasetManager.destroyDataset(dataset)
      ));
    } finally {
      await this.refresh();
    }
  },
});
