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

const buttonNames = Object.freeze([
  'btnRefresh',
  'btnShowFile',
  'btnChangeState',
  'btnRemove',
]);

export default BaseBrowserModel.extend({
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
  browserClass: 'dataset-browser',

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
  selectedDatasetsState: undefined,

  _window: window,

  navigateDataTarget: '_top',

  //#region Action buttons

  btnShowFile: computed('selectionContext', function btnShowFile() {
    const selectionContext = this.get('selectionContext');
    return this.createFileAction({
      id: 'showFile',
      icon: 'browser-' +
        (selectionContext === actionContext.singleFile ? 'file' : 'directory'),
      title: this.t(
        'fileActions.showFile.' +
        (selectionContext === actionContext.singleFile ? 'file' : 'dir')
      ),
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

  btnChangeState: computed('selectedDatasetsState', function btnChangeState() {
    const selectedDatasetsState = this.get('selectedDatasetsState');
    const isAttachAction = selectedDatasetsState === 'detached';
    return this.createFileAction({
      id: 'showFile',
      icon: isAttachAction ? 'checked' : 'x',
      title: this.t(
        'fileActions.changeState.' + (isAttachAction ? 'attach' : 'detach')
      ),
      disabled: false,
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
      disabled: false,
      action: (datasets) => {
        return this.askForRemoveDatasets(datasets);
      },
      showIn: [
        ...anySelectedContexts,
      ],
    });
  }),

  //#endregion

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
    const attach = targetState === 'attached';
    return modalManager.show('question-modal', {
        headerIcon: attach ? 'sign-info-rounded' : 'sign-warning-rounded',
        headerText: this.t(
          'toggleDatasetAttachment.header.' + (attach ? 'attach' : 'detach')
        ),
        // FIXME: text for multiple datasets
        descriptionParagraphs: [{
          text: this.t(
            'toggleDatasetAttachment.description.' + (attach ? 'attach' : 'detach'), {
              name: get(datasets[0], 'name'),
              path: get(datasets[0], 'rootFilePath'),
              filePath: get(datasets[0], 'rootFileType'),
            }
          ),
        }, {
          text: this.t('toggleDatasetAttachment.proceedQuestion'),
        }],
        yesButtonText: this.t('toggleDatasetAttachment.yes'),
        yesButtonClassName: attach ? 'btn-primary' : 'btn-danger',
        onSubmit: async () => {
          // FIXME: handle partial failure -> ticket
          try {
            return await this.toggleDatasetsAttachment(datasets, targetState);
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
        // FIXME: show other modal with list of links to go to moved datasets -> ticket
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
      headerText: this.t('remove.header'),
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

  async toggleDatasetsAttachment(datasets, state) {
    const datasetManager = this.get('datasetManager');
    try {
      await allFulfilled(datasets.map(dataset =>
        datasetManager.toggleDatasetAttachment(dataset, state)
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
