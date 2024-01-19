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
import EmberObject, { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
import { conditional, promise, raw } from 'ember-awesome-macros';
import {
  CopyDatasetIdAction,
  CreateArchiveAction,
  BrowserChangeStateAction,
  BrowserRemoveAction,
} from 'oneprovider-gui/utils/dataset/actions';
import globals from 'onedata-gui-common/utils/globals';
import { resolve, all as allFulfilled } from 'rsvp';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';
import ColumnsConfiguration from 'oneprovider-gui/utils/columns-configuration';

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

  /**
   * @override
   */
  browserPersistedConfigurationKey: 'dataset',

  navigateDataTarget: '_top',

  /**
   * One of: attached, detached.
   * Which state tree of datasets is displayed.
   * @type {ComputedProperty<String>}
   */
  attachmentState: reads('spaceDatasetsViewState.attachmentState').readOnly(),

  //#region Action buttons

  btnCopyId: computed(function btnCopyId() {
    return this.createItemBrowserAction(CopyDatasetIdAction);
  }),

  btnShowFile: computed('selectionContext', function btnShowFile() {
    const selectionContext = this.get('selectionContext');
    return this.createItemBrowserAction({
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
    return this.createItemBrowserAction(CreateArchiveAction, {
      onOpenCreateArchive: this.openCreateArchiveModal.bind(this),
      spacePrivileges,
    });
  }),

  btnChangeState: computed(
    'attachmentState',
    'spacePrivileges.manageDatasets',
    function btnChangeState() {
      return this.createItemBrowserAction(CustomAttachmentChangeStateAction, {
        attachmentState: this.attachmentState,
        spacePrivileges: this.spacePrivileges,
        browserModel: this,
      });
    }
  ),

  btnRemove: computed(
    'spacePrivileges.manageDatasets',
    function btnRemove() {
      return this.createItemBrowserAction(BrowserRemoveAction, {
        browserModel: this,
        spacePrivileges: this.spacePrivileges,
      });
    }
  ),

  btnProtection: computed(function btnProtection() {
    return this.createItemBrowserAction({
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
  createColumnsConfiguration() {
    const columns = {
      archives: EmberObject.create({
        isVisible: true,
        isEnabled: true,
        width: 150,
      }),
      created: EmberObject.create({
        isVisible: true,
        isEnabled: true,
        width: 200,
      }),
    };
    const columnsOrder = ['archives', 'created'];
    const elementFbTableThead = this.element?.querySelector('.fb-table-thead');
    return ColumnsConfiguration.create({
      configurationType: this.browserPersistedConfigurationKey,
      columns,
      columnsOrder,
      firstColumnWidth: 350,
      tableThead: elementFbTableThead,
    });
  },

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

  /**
   * @override
   */
  async fetchDirChildren(...fetchArgs) {
    const [dirId] = fetchArgs;
    if (dirId === spaceDatasetsRootId) {
      return this.fetchSpaceDatasets(...fetchArgs);
    } else {
      return this.fetchDatasetChildren(...fetchArgs);
    }
  },

  async fetchSpaceDatasets(rootId, startIndex, size, offset /**, array */ ) {
    if (rootId !== spaceDatasetsRootId) {
      throw new Error(
        'fetchSpaceDatasets: cannot use fetchSpaceDatasets for non-root'
      );
    }
    if (size <= 0) {
      return this.getEmptyFetchChildrenResponse();
    } else {
      return this.browserizeDatasets(await this.datasetManager.fetchChildrenDatasets({
        parentType: 'space',
        parentId: this.spaceId,
        state: this.attachmentState,
        index: startIndex,
        limit: size,
        offset,
      }));
    }
  },

  async fetchDatasetChildren(datasetId, startIndex, size, offset) {
    return this.browserizeDatasets(await this.datasetManager.fetchChildrenDatasets({
      parentType: 'dataset',
      parentId: datasetId,
      state: this.attachmentState,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  async browserizeDatasets({ childrenRecords, isLast }) {
    const datasetManager = this.datasetManager;
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(r =>
        datasetManager.getBrowsableDataset(r)
      )),
      isLast,
    };
  },

  showRootFile(dataset) {
    const {
      getDataUrl,
      navigateDataTarget,
    } = this.getProperties('getDataUrl', 'navigateDataTarget');
    const fileId = dataset.relationEntityId('rootFile');
    const url = getDataUrl({ fileId: null, selected: [fileId] });
    return globals.window.open(url, navigateDataTarget);
  },
});

/**
 * ChangeStateAction without `attachmentState`, because it is injected by
 * DatasetBrowserModel.
 */
const CustomAttachmentChangeStateAction = BrowserChangeStateAction.extend({
  attachmentState: null,
});

export const spaceDatasetsRootId = 'spaceDatasetsRoot';

export const SpaceDatasetsRootBaseClass = EmberObject.extend({
  // dataset-like properties
  id: spaceDatasetsRootId,
  entityId: spaceDatasetsRootId,
  parent: promise.object(raw(resolve(null))),
  hasParent: false,
  protectionFlags: Object.freeze([]),
  rootFile: promise.object(raw(resolve(null))),
  rootFilePath: '/',
  rootFileType: 'dir',

  // special properties
  isDatasetsRoot: true,

  // virtual properties
  name: undefined,
  state: undefined,

  // dataset-like methods
  relationEntityId( /*relation*/ ) {
    return null;
  },
  async reload() {
    return this;
  },
});

export const SpaceDatasetsRootClass = BrowsableDataset.extend({
  content: SpaceDatasetsRootBaseClass.create(),
});
