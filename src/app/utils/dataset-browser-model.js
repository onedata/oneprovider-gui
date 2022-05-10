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
import { conditional } from 'ember-awesome-macros';
import {
  CopyDatasetId,
  CreateArchive,
  ChangeState,
} from 'oneprovider-gui/utils/dataset/actions';

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

  selectedDatasetsHaveArchives: computed(
    'selectedItems.@each.archiveCount',
    function selectedDatasetsHaveArchives() {
      return _.sum(this.get('selectedItems').mapBy('archiveCount')) > 0;
    }
  ),

  //#region Action buttons

  btnCopyId: computed(function btnCopyId() {
    return this.createFileAction(CopyDatasetId);
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

  btnCreateArchive: computed('spacePrivileges', function btnCreateArchive() {
    const spacePrivileges = this.get('spacePrivileges');
    return this.createFileAction(CreateArchive, {
      onOpenCreateArchive: this.openCreateArchiveModal.bind(this),
      spacePrivileges,
    });
  }),

  btnChangeState: computed(
    'attachmentState',
    function btnChangeState() {
      // use attachmentState from this component to prevent unnecessary action recompute
      const attachmentState = this.get('attachmentState');
      return this.createFileAction(ChangeState, {
        attachmentState,
        onStateChanged: this.refresh.bind(this),
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

  async removeDatasets(datasets) {
    const datasetManager = this.get('datasetManager');
    const result = await allSettled(datasets.map(dataset =>
      datasetManager.destroyDataset(dataset)
    ));
    try {
      await this.refresh();
    } catch (error) {
      console.error(
        'util:dataset-browser-model#removeDatasets: refreshing browser after removing datasets failed:',
        error
      );
    }
    return result;
  },
});
