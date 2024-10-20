/**
 * Modal with detailed views about file or directory.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { reads } from '@ember/object/computed';
import {
  promise,
  raw,
  or,
  gt,
  and,
  notEqual,
  collect,
  bool,
  not,
  writable,
} from 'ember-awesome-macros';
import { computed, get, set, getProperties } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled, Promise } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { next } from '@ember/runloop';
import { extractDataFromPrefixedSymlinkPath } from 'oneprovider-gui/utils/symlink-utils';
import _ from 'lodash';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import TabModelFactory from 'oneprovider-gui/utils/file-info/tab-model-factory';
import TabItem from 'oneprovider-gui/utils/file-info/tab-item';
import TabModels from 'oneprovider-gui/utils/file-info/tab-models';
import { commonActionIcons } from 'oneprovider-gui/utils/filesystem-browser-model';
import { guidFor } from '@ember/object/internals';
import FileConsumerMixin, { computedMultiUsedFileGris } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import createPropertyComparator from 'onedata-gui-common/utils/create-property-comparator';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import { asyncObserver } from 'onedata-gui-common/utils/observer';

const mixins = [
  I18n,
  FileConsumerMixin,
  createDataProxyMixin('fileHardlinks'),
];

/**
 * @typedef {'general'|'hardlinks'|'size'|'apiSamples'|'metadata'|'permissions'} FileInfoTabId
 */

/**
 * @typedef {OneTabBarItem} FileInfoTabItem
 * @property {FileInfoTabId} id
 * @property {string} [statusIcon]
 * @property {string} [tabClass]
 */

/**
 * @typedef {'show'|'download'} FileInfoModal.FileLinkType
 */

/**
 * Group where the link copy input is rendered.
 * - browser: Web Browser links that opens the application and do some action on file,
 *   like selecting it and downloading,
 * - public: links that works without authentication.
 * @typedef {'browser'|'public'} FileInfoModal.FileLinkGroup
 */

/**
 * @typedef {Object} FileInfoModal.FileLinkModel
 * @property {FileInfoModal.FileLinkGroup} group
 * @property {string} url
 * @property {FileInfoModal.FileLinkType} type
 * @property {SafeString} label
 * @property {SafeString} tip
 */

export default Component.extend(...mixins, {
  i18n: service(),
  fileManager: service(),
  errorExtractor: service(),
  spaceManager: service(),
  storageManager: service(),
  providerManager: service(),
  appProxy: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.fileInfoModal',

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * Share to which opened file belongs to (should be provided in preview mode),
   * that will be used as context for some info.
   * @virtual
   * @type {String}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual optional
   * @type {String}
   */
  modalClass: '',

  /**
   * Keys are ids of tab models (see available tabs in `tabModels` property).
   * Values are objects with properties that are used to create tab models.
   * See `tabModels` for implementation.
   * @virtual optional
   * @type {Object<string, Object>}
   */
  tabOptions: null,

  /**
   * Space entity ID can be provided instead of space model if it's not available
   * in current context (eg. in public share view).
   * @virtual optional
   * @type {Models.Space}
   */
  spaceId: reads('space.entityId'),

  /**
   * Possible values the same as for `activeTab` property
   * @virtual optional
   * @type {String}
   */
  initialTab: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getProvidersUrl: notImplementedIgnore,

  // TODO: VFS-11470 make global file updater registry, because many components would
  // need to update individual files data - as in this components, where the qos-tab-model
  // updates files when modal is opened
  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('previewMode', 'files.[]', function fileRequirements() {
    // Requirements only for tabs that are implemented in file-info-modal:
    // general, hardlinks, size, apiSamples - these tabs are displayed only when single
    // file is diplayed.
    if (this.files?.length === 1) {
      // TODO: VFS-11449 optional file size fetch
      const properties = [
        'mtime',
        'ctime',
        'atime',
        // TODO: VFS-12343 restore creationTime in GUI
        // 'creationTime',
      ];
      if (!this.previewMode) {
        properties.push('owner', 'hardlinkCount');
      }
      return this.files.map(file => new FileRequirement({
        fileGri: get(file, 'id'),
        properties,
      }));
    } else {
      return [];
    }
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedMultiUsedFileGris('files'),

  /**
   * @type {FileInfoTabId}
   */
  activeTab: 'general',

  /**
   * If true, whole content will take up smaller amount of space
   * @type {boolean}
   */
  smallContent: true,

  /**
   * @type {Number}
   */
  hardlinksLimit: 100,

  /**
   * @type {ComputedProperty<boolean>}
   */
  previewMode: reads('browserModel.previewMode'),

  /**
   * @type {ComputedProperty<string>}
   */
  modalId: computed(function modalId() {
    return `${guidFor(this)}-modal`;
  }),

  tabItemsIcons: computed(function tabItemsIcons() {
    const icons = {
      ...commonActionIcons,
      apiSamples: 'rest',
      size: 'overview',
    };
    icons.general = icons.info;
    delete icons.info;
    return icons;
  }),

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('files.firstObject'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isMultiFile: gt('files.length', 1),

  isOwnerVisible: not(or('previewMode', 'fileIsSpaceRoot')),

  fileIsSpaceRoot: computed('file.entityId', 'space', function fileIsSpaceRoot() {
    if (!this.space) {
      return false;
    }
    return get(this.file, 'entityId') === this.space.relationEntityId('rootDir');
  }),

  itemType: reads('file.type'),

  typeTranslation: computed('isMultiFile', 'itemType', function typeTranslation() {
    if (this.isMultiFile) {
      return '';
    }
    return _.upperFirst(this.t(`fileType.${this.itemType}`, {}, {
      defaultValue: this.t('fileType.file'),
    }));
  }),

  /**
   * @type {boolean}
   */
  areStorageLocationsExpanded: false,

  /**
   * @type {ComputedProperty<Array<FileInfoModal.FileLinkModel>>}
   */
  availableFileLinkModels: computed(
    'typeTranslation',
    'previewMode',
    'file.{type,cdmiObjectId}',
    'apiSamples',
    function availableFileLinkModels() {
      if (!this.get('file.type')) {
        return [];
      }
      // TODO: VFS-11156 Implement shared files global show URL
      if (this.previewMode) {
        const sample = this.apiSamples?.find(sample =>
          sample.swaggerOperationId === 'get_shared_data'
        );
        const url = sample && (sample.apiRoot + sample.path);
        return [{
          type: 'download',
          group: 'public',
          url,
          label: this.t('fileLinkLabel.public.download'),
          tip: this.t('fileLinkTip.public.download', {
            type: _.lowerCase(this.typeTranslation),
          }, {
            defaultValue: '',
          }),
        }];
      } else {
        return ['show', 'download'].map(fileLinkType => ({
          type: fileLinkType,
          group: 'browser',
          url: this.appProxy.callParent('getFileGoToUrl', {
            fileId: this.get('file.cdmiObjectId'),
            fileAction: fileLinkType,
          }),
          label: this.t(`fileLinkLabel.browser.${fileLinkType}`),
          tip: this.t(`fileLinkTip.browser.${fileLinkType}`, {
            type: _.lowerCase(this.typeTranslation),
          }, {
            defaultValue: '',
          }),
        }));
      }
    }
  ),

  groupedFileLinkModels: computed(
    'availableFileLinkModels',
    function groupedFileLinkModels() {
      return _.groupBy(this.availableFileLinkModels, 'group');
    }
  ),

  fileLinkModelsGroups: computed(
    'groupedFileLinkModels',
    function fileLinkModelsGroups() {
      return Object.keys(this.groupedFileLinkModels);
    }
  ),

  headerText: computed('typeTranslation', function headerText() {
    if (this.typeTranslation) {
      return this.t('header', { type: this.typeTranslation });
    } else {
      return this.t('headerDefault');
    }
  }),

  fileName: reads('file.name'),

  apiSamplesProxy: promise.object(computed(
    'file.entityId',
    'previewMode',
    function apiSamples() {
      const fileId = this.get('file.entityId');
      return this.fileManager.getFileApiSamples(
        fileId,
        this.previewMode ? 'public' : 'private'
      );
    }
  )),

  apiSamples: reads('apiSamplesProxy.content'),

  /**
   * Is writable for testing purposes
   * @type {PromiseObject<Models.StorageLocationInfo>}
   */
  storageLocationsProxy: writable(computedRelationProxy(
    'file',
    'storageLocationInfo'
  ), (value) => value),

  /**
   * @type {PromiseObject<Models.Provider>}
   */
  currentProviderProxy: promise.object(computed(function currentProviderProxy() {
    return this.get('providerManager').getCurrentProvider();
  })),

  /**
   * @type {ComputedProperty<String>}
   */
  currentProviderName: reads('currentProviderProxy.content.name'),

  /**
   * @type {ComputedProperty<String>}
   */
  currentProviderId: reads('currentProviderProxy.content.entityId'),

  /**
   * @type {PromiseObject<Ember.Array<Object>|null> }
   */
  currentProviderLocationsProxy: promise.object(computed(
    'storageLocationsPerProviderProxy',
    'currentProviderProxy',
    async function currentProviderLocationsProxy() {
      const currentProvider = await this.get('currentProviderProxy');
      const currentProviderId = get(currentProvider, 'entityId');
      const storageLocationsPerProvider = await this.get(
        'storageLocationsPerProviderProxy'
      );
      if (
        storageLocationsPerProvider &&
        currentProviderId in storageLocationsPerProvider
      ) {
        return storageLocationsPerProvider[currentProviderId];
      } else {
        return null;
      }
    }
  )),

  /**
   * @type {PromiseObject}
   */
  storageLocationRequiredDataProxy: promise.object(promise.all(
    'storageLocationsPerProviderProxy',
    'currentProviderProxy',
    'currentProviderLocationsProxy',
  )),

  /**
   * @type {PromiseObject<Ember.Array<Object>|null>}
   */
  storageLocationsPerProviderProxy: promise.object(computed(
    'storageLocationsProxy.locationsPerProvider',
    'storageManager',
    'spaceId',
    async function storageLocationsPerProviderProxy() {
      const {
        spaceId,
        storageManager,
      } = this.getProperties(
        'spaceId',
        'storageManager',
      );

      const locationsPerProviderWithStorageName = {};
      const storageLocations = await this.get('storageLocationsProxy');
      const locationsPerProvider = get(storageLocations, 'locationsPerProvider');

      for (const providerId in locationsPerProvider) {
        const locationsPerStorage = locationsPerProvider[providerId].locationsPerStorage;

        for (const storageId in locationsPerStorage) {
          const storage = await storageManager.getStorageById(storageId, {
            throughSpaceId: spaceId,
            backgroundReload: false,
          });

          const provider = await get(storage, 'provider');
          const storageName = get(storage, 'name');

          const storageNameWithPath = {
            storageName,
            provider,
            path: locationsPerStorage[storageId],
          };

          if (providerId in locationsPerProviderWithStorageName) {
            locationsPerProviderWithStorageName[providerId].push(storageNameWithPath);
          } else {
            locationsPerProviderWithStorageName[providerId] = [storageNameWithPath];
          }
        }

        if (locationsPerProvider[providerId].error) {
          const provider = await this.providerManager.getProviderById(providerId);
          const providerError = {
            storageName: null,
            provider,
            error: locationsPerProvider[providerId].error,
          };
          locationsPerProviderWithStorageName[providerId] = [providerError];
        }
      }

      if (_.isEmpty(locationsPerProvider)) {
        return null;
      } else {
        return locationsPerProviderWithStorageName;
      }
    })),

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  storageLocationsPerProviderOrder: computed(
    'storageLocationsPerProviderProxy.content',
    function storageLocationsPerProviderOrder() {
      if (this.storageLocationsPerProviderProxy.content) {
        const storageLocationsPerProvider = Object.values(
          this.storageLocationsPerProviderProxy.content
        );
        const compareNames = createPropertyComparator('firstObject.provider.name');
        storageLocationsPerProvider.sort(compareNames);
        return storageLocationsPerProvider;
      }
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  firstProviderDisplayedId: computed(
    'storageLocationsPerProviderProxy.content',
    'currentProviderId',
    'storageLocationsPerProviderOrder',
    function firstProviderDisplayedId() {
      if (this.storageLocationsPerProviderProxy.content) {
        const storageLocationsPerProvider = this.storageLocationsPerProviderProxy.content;
        for (const location of storageLocationsPerProvider[this.currentProviderId]) {
          if (location.path) {
            return this.currentProviderId;
          }
        }
        for (const locations of this.storageLocationsPerProviderOrder) {
          for (const location of locations) {
            if (location.path) {
              return location.provider.entityId;
            }
          }
        }
        return this.storageLocationsPerProviderOrder[0][0].provider.entityId;
      }
    }
  ),

  storageLocationsPerProviderLength: computed(
    'storageLocationsPerProviderProxy.content',
    function storageLocationsPerProviderLength() {
      const storageLocationsPerProvider = this.get(
        'storageLocationsPerProviderProxy.content'
      );
      if (!storageLocationsPerProvider) {
        return 0;
      }
      return Object.keys(storageLocationsPerProvider).length;
    }
  ),

  symlinkTargetPath: computed(
    'file.{type,symlinkValue}',
    'space.{entityId,name}',
    function symlinkTargetPath() {
      const {
        file,
        space,
      } = this.getProperties('file', 'space');
      const {
        name: spaceName,
        entityId: spaceEntityId,
      } = getProperties(space || {}, 'name', 'entityId');
      const {
        type: fileType,
        symlinkValue,
      } = getProperties(file || {}, 'type', 'symlinkValue');
      if (fileType !== 'symlink') {
        return;
      }

      const pathParseResult = extractDataFromPrefixedSymlinkPath(symlinkValue || '');
      if (!pathParseResult) {
        return symlinkValue;
      }

      if (pathParseResult.spaceId !== spaceEntityId || !spaceName) {
        return `/<${this.t('unknownSpaceInSymlink')}>${pathParseResult.path}`;
      }
      return `/${spaceName}${pathParseResult.path}`;
    }
  ),

  cdmiObjectId: reads('file.cdmiObjectId'),

  /**
   * @type {number}
   */
  mtime: reads('file.mtime'),

  /**
   * @type {number}
   */
  atime: reads('file.atime'),

  /**
   * @type {number}
   */
  ctime: reads('file.ctime'),

  /**
   * // TODO: VFS-12343 restore creationTime in GUI
   * @type {number}
   */
  // creationTime: reads('file.creationTime'),

  fileSize: reads('file.size'),

  hardlinkCount: or('file.hardlinkCount', raw(1)),

  hardlinksLimitExceeded: gt('hardlinkCount', 'hardlinksLimit'),

  hardlinksFetchError: computed(
    'fileHardlinks.errors',
    function hardlinksFetchError() {
      const errors = this.get('fileHardlinks.errors') || [];
      if (!errors.length) {
        return;
      }

      const errorExtractor = this.get('errorExtractor');
      const uniqueErrors = errors.filterBy('id').uniqBy('id');
      const mainErrorDescription = uniqueErrors.length > 0 ?
        errorExtractor.getMessage(uniqueErrors[0]).message :
        this.t('tabs.hardlinks.unknownFetchError');
      if (uniqueErrors.length <= 1) {
        return this.t('tabs.hardlinks.hardlinksFetchSingleErrorTip', {
          fetchError: mainErrorDescription,
        });
      } else {
        return this.t('tabs.hardlinks.hardlinksFetchMultiErrorTip', {
          fetchError: mainErrorDescription,
          moreCount: uniqueErrors.length - 1,
        });
      }
    }
  ),

  /**
   * @type {ComputedProperty<PromiseObject<Models.User>>}
   */
  ownerProxy: promise.object(computed('file.owner', async function ownerProxy() {
    return await this.fileManager.getFileOwner(this.file);
  })),

  /**
   * @type {Models.User}
   */
  owner: reads('ownerProxy.content'),

  /**
   * @type {Object}
   */
  errorReasonForOwnerProxy: reads('ownerProxy.reason'),

  filePathProxy: promise.object(computed(
    'file.{parent.name,name}',
    async function filePathProxy() {
      const path = await resolveFilePath(this.file);
      if (
        this.space &&
        get(path[0], 'entityId') !== this.space.relationEntityId('rootDir')
      ) {
        const fileArchiveInfo = FileArchiveInfo.create({
          file: this.file,
          ownerSource: this,
        });
        const isInArchive = await fileArchiveInfo.isInArchiveProxy;
        if (isInArchive) {
          path.unshift(await get(this.space, 'rootDir'));
        }
      }
      return stringifyFilePath(path);
    }
  )),

  filePath: reads('filePathProxy.content'),

  /**
   * @type {ComputedProperty<String>}
   */
  cdmiRowId: computed('elementId', function cdmiRowId() {
    return this.get('elementId') + '-row-cdmi';
  }),

  isFooterShown: bool('activeTabModel.footerComponent'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isGeneralTabVisible: not('isMultiFile'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isHardlinksTabVisible: and(
    gt('hardlinkCount', raw(1)),
    not('isMultiFile'),
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isApiSamplesTabVisible: and(
    not('isMultiFile'),
    notEqual('itemType', raw('symlink'))
  ),

  /**
   * @type {Array<FileInfoTabId>}
   */
  visibleTabs: computed(
    'isGeneralTabVisible',
    'isHardlinksTabVisible',
    'isApiSamplesTabVisible',
    'visibleTabsModels.@each.isVisible',
    function visibleTabs() {
      const tabs = [];
      if (this.isGeneralTabVisible) {
        tabs.push('general');
      }
      if (this.isHardlinksTabVisible) {
        tabs.push('hardlinks');
      }
      if (this.isApiSamplesTabVisible) {
        tabs.push('apiSamples');
      }
      tabs.push(...this.visibleTabsModels.mapBy('tabId'));
      return tabs;
    },
  ),

  // TODO: VFS-9628 will contain all tab models after refactor
  allTabModels: collect(
    'tabModels.size',
    'tabModels.metadata',
    'tabModels.permissions',
    'tabModels.shares',
    'tabModels.qos',
    'tabModels.distribution',
  ),

  // TODO: VFS-9628 will contain all tab models after refactor
  // Using computed instead of computed macro because there are issues
  // with auto update when using array.filterBy.
  visibleTabsModels: computed(
    'allTabModels.@each.isVisible',
    function visibleTabsModels() {
      return this.allTabModels.filterBy('isVisible');
    }
  ),

  /**
   * @type {ComputedProperty<Array<FileInfoTabItem>>}
   */
  visibleTabsItems: computed(
    'builtInTabItems',
    'visibleTabs',
    'visibleTabsModels',
    'tabItemsIcons',
    function visibleTabsItems() {
      const tabItems = [];
      const nonModelTabIds = [
        'general',
        'apiSamples',
        'hardlinks',
      ];
      for (const tabId of nonModelTabIds) {
        if (!this.visibleTabs.includes(tabId)) {
          continue;
        }
        tabItems.push(this.builtInTabItems[tabId]);
      }
      const modelBasedTabItems = this.visibleTabsModels.map(tabModel => {
        return TabItem.create({
          tabModel,
        });
      });
      tabItems.push(...modelBasedTabItems);
      for (const item of tabItems) {
        const itemId = item.id;
        set(item, 'icon', this.tabItemsIcons[itemId] || null);
      }
      return tabItems;
    }
  ),

  /**
   * @type {ComputedProperty<FileInfoTabItem|null>}
   */
  activeTabItem: computed('activeTab', 'visibleTabItems', function activeTabItem() {
    const activeTab = this.activeTab;
    return this.visibleTabsItems.find(({ id }) => id && id === activeTab);
  }),

  builtInTabItems: computed(
    'hardlinksLimitExceeded',
    'hardlinksLimit',
    'hardlinkCount',
    function builtInTabItems() {
      const hardlinkCount = this.hardlinksLimitExceeded ?
        `${this.hardlinksLimit}+` :
        this.hardlinkCount;

      return {
        /** @type {FileInfoTabItem} */
        general: {
          id: 'general',
          name: this.t('tabs.general.tabTitle'),
        },

        /** @type {FileInfoTabItem} */
        hardlinks: {
          id: 'hardlinks',
          name: this.t('tabs.hardlinks.tabTitle'),
          statusNumber: hardlinkCount,
        },

        /** @type {FileInfoTabItem} */
        apiSamples: {
          id: 'apiSamples',
          name: this.t('tabs.apiSamples.tabTitle'),
        },
      };
    }),

  tabModels: computed(function tabModels() {
    return TabModels.create({
      fileInfoModal: this,
    });
  }),

  tabModelFactory: computed(function tabModelFactory() {
    return TabModelFactory.create({
      fileInfoModal: this,
      ownerSource: this,
    });
  }),

  activeTabModel: computed('activeTab', function activeTabModel() {
    return this.tabModels[this.activeTab];
  }),

  effModalClass: computed(
    'modalClass',
    'activeTabModel.modalClass',
    function effModalClass() {
      const additionalClassName = this.activeTabModel ?
        (this.activeTabModel.modalClass || '') : 'without-footer';
      return `${this.modalClass || ''} ${additionalClassName}`;
    }
  ),

  showStorageLocations: computed(
    'itemType',
    'previewMode',
    function showStorageLocations() {
      return this.itemType === LegacyFileType.Regular && !this.previewMode;
    }
  ),

  hardlinksAutoUpdater: asyncObserver(
    'file.hardlinkCount',
    function hardlinksAutoUpdater() {
      if (this.activeTab === 'hardlinks') {
        this.updateFileHardlinksProxy();
      }
    }
  ),

  storageLocationsAutoUpdater: asyncObserver(
    'file.{parent.name,name}',
    async function storageLocationsAutoUpdater() {
      if (get(this.file, 'type') === LegacyFileType.Regular) {
        this.file.belongsTo('storageLocationInfo').reload();
      }
    }
  ),

  init() {
    this._super(...arguments);
    const initialTab = this.initialTab;
    const visibleTabs = this.visibleTabs;
    this.set('activeTab', visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0]);

    // BUGFIX: `isActive` property value does not recalculate properly when we
    // enter directly "size" tab. We need to kick changes detection manually.
    this.activeTabModel?.notifyPropertyChange('isActive');

    // check just the first file, because all files should have the same scope
    if (this.showStorageLocations && get(this.file, 'scope') !== 'public') {
      this.currentProviderLocationsProxy.then(currentProviderLocations => {
        if (currentProviderLocations.length === 0 && !this.areStorageLocationsExpanded) {
          this.set('areStorageLocationsExpanded', true);
        }
      });
    }
  },

  willDestroyElement() {
    try {
      for (const tabModel of this.allTabModels) {
        tabModel?.destroy?.();
      }
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  fetchFileHardlinks() {
    const {
      previewMode,
      fileManager,
      getDataUrl,
      hardlinksLimit,
    } = this.getProperties(
      'previewMode',
      'fileManager',
      'getDataUrl',
      'hardlinksLimit'
    );

    if (previewMode) {
      return resolve([]);
    }
    return new Promise(resolvePromise => {
      // Moving it to next runloop frame as it may trigger double-render error
      // of tabs.
      next(() => resolvePromise(
        fileManager.getFileHardlinks(this.get('file.entityId'), hardlinksLimit)
        .then((({ hardlinkCount, hardlinks, errors }) =>
          allFulfilled(hardlinks.map(hardlinkFile =>
            resolveFilePath(hardlinkFile)
            .then(path => stringifyFilePath(path))
            .catch(() => null)
            .then(async path => ({
              file: hardlinkFile,
              fileUrl: await getDataUrl({
                fileId: null,
                selected: [get(hardlinkFile, 'entityId')],
              }),
              path,
            }))
          )).then(newHardlinks => ({
            hardlinkCount,
            hardlinks: newHardlinks,
            errors,
          }))
        ))
      ));
    });
  },

  close() {
    (async () => {
      if ((await this.activeTabModel?.checkClose?.()) ?? true) {
        this.onHide?.();
      }
    })();
    return false;
  },

  actions: {
    /**
     * @param {FileInfoTabItem} tabItem
     * @returns {Promise}
     */
    async changeTab({ id: tabId }) {
      if (tabId === this.activeTab) {
        return;
      }
      if ((await this.activeTabModel?.checkClose?.()) ?? true) {
        this.set('activeTab', tabId);
      }
    },
    close() {
      return this.close();
    },
    toggleStorageLocations() {
      this.toggleProperty('areStorageLocationsExpanded');
    },
  },
});
