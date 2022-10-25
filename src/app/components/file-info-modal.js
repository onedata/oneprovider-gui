/**
 * Modal with detailed views about file or directory.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
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
  equal,
  not,
  tag,
} from 'ember-awesome-macros';
import EmberObject, { computed, get, getProperties } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled, Promise } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { next } from '@ember/runloop';
import { extractDataFromPrefixedSymlinkPath } from 'oneprovider-gui/utils/symlink-utils';
import _ from 'lodash';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import TabModelFactory from 'oneprovider-gui/utils/file-info/tab-model-factory';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

const mixins = [
  I18n,
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

export default Component.extend(...mixins, {
  i18n: service(),
  fileManager: service(),
  errorExtractor: service(),
  spaceManager: service(),
  storageManager: service(),
  providerManager: service(),

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
   * @virtual optional
   * @type {Boolean}
   */
  previewMode: false,

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
    return this.file.entityId === this.space.relationEntityId('rootDir');
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
   * @type {PromiseObject<Models.StorageLocationInfo>}
   */
  storageLocationsProxy: computedRelationProxy(
    'file',
    'storageLocationInfo'
  ),

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
   * @type {ComputedProperty<Boolean>}
   */
  areStorageLocationsExpanded: equal('currentProviderLocationsProxy.length', 0),

  /**
   * @type {PromiseObject<Ember.Array<Object>|null>}
   */
  storageLocationsPerProviderProxy: promise.object(computed(
    'storageLocationsProxy',
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
      const storageLocationsProxy = await this.get('storageLocationsProxy');

      const locationsPerProvider = get(storageLocationsProxy, 'locationsPerProvider');

      for (const providerId in locationsPerProvider) {
        const locationsPerStorage = locationsPerProvider[providerId].locationsPerStorage;

        for (const storageId in locationsPerStorage) {
          const storage = await storageManager.getStorageById(storageId, {
            throughSpaceId: spaceId,
            backgroundReload: false,
          });

          const provider = await get(storage, 'provider');
          const providerName = get(provider, 'name');
          const storageName = get(storage, 'name');

          const storageNameWithPath = {
            storageName,
            providerName,
            path: locationsPerStorage[storageId],
          };

          if (providerId in locationsPerProviderWithStorageName) {
            locationsPerProviderWithStorageName[providerId].push(storageNameWithPath);
          } else {
            locationsPerProviderWithStorageName[providerId] = [storageNameWithPath];
          }
        }
      }

      if (_.isEmpty(locationsPerProvider)) {
        return null;
      } else {
        return locationsPerProviderWithStorageName;
      }
    }
  )),

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

  fileGuiUrlProxy: promise.object(computed('file.entityId', async function fileGuiUrl() {
    const {
      file,
      getDataUrl,
    } = this.getProperties('file', 'getDataUrl');
    if (!file || !getDataUrl || getDataUrl === notImplementedThrow) {
      return;
    }
    return await getDataUrl({
      dir: null,
      selected: [get(file, 'entityId')],
    });
  })),

  fileGuiUrl: reads('fileGuiUrlProxy.content'),

  symlinkTargetPath: computed(
    'file.{type,targetPath}',
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
        targetPath,
      } = getProperties(file || {}, 'type', 'targetPath');
      if (fileType !== 'symlink') {
        return;
      }

      const pathParseResult = extractDataFromPrefixedSymlinkPath(targetPath || '');
      if (!pathParseResult) {
        return targetPath;
      }

      if (pathParseResult.spaceId !== spaceEntityId || !spaceName) {
        return `/<${this.t('unknownSpaceInSymlink')}>${pathParseResult.path}`;
      }
      return `/${spaceName}${pathParseResult.path}`;
    }
  ),

  cdmiObjectId: reads('file.cdmiObjectId'),

  modificationTime: reads('file.modificationTime'),

  fileSize: reads('file.size'),

  /**
   * One of `enabled`, `disabled`, `stopping`, `initializing`
   * @type {ComputedProperty<String>}
   */
  dirStatsServiceStatus: reads('dirStatsServiceState.status'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSizeStatsDisabled: computed(
    'dirStatsServiceStatus',
    'itemType',
    function isSizeStatsDisabled() {
      const {
        dirStatsServiceStatus,
        itemType,
      } = this.getProperties('dirStatsServiceStatus', 'itemType');
      return ['disabled', 'stopping'].includes(dirStatsServiceStatus) ||
        itemType === 'symlink';
    }
  ),

  hardlinksCount: or('file.hardlinksCount', raw(1)),

  hardlinksLimitExceeded: gt('hardlinksCount', 'hardlinksLimit'),

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

  owner: reads('ownerProxy.content'),

  filePathProxy: promise.object(
    computed('file.parent', function filePathPromise() {
      return resolveFilePath(this.get('file'))
        .then(path => stringifyFilePath(path));
    })
  ),

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
    gt('hardlinksCount', raw(1)),
    not('isMultiFile'),
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSizeTabVisible: computed(
    'previewMode',
    'isMultiFile',
    'file.effFile.type',
    'itemType',
    function isSizeTabVisible() {
      const effItemType = this.file.effFile?.type || 'file';
      return !this.previewMode && !this.isMultiFile && effItemType !== 'file' &&
        this.itemType !== 'symlink';
    }
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
    'isSizeTabVisible',
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
      if (this.isSizeTabVisible) {
        tabs.push('size');
      }
      if (this.isApiSamplesTabVisible) {
        tabs.push('apiSamples');
      }
      tabs.push(...this.visibleTabsModels.mapBy('tabId'));
      return tabs;
    },
  ),

  // TODO: VFS-9628 this is a temporary list of tabs moved from separate modals
  specialFileTabs: Object.freeze([
    'metadata',
    'permissions',
    'shares',
    'qos',
    'distribution',
  ]),

  // TODO: VFS-9628 will contain all tab models after refactor
  allTabModels: collect(
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
    'visibleTabs',
    'visibleTabsModels',
    function visibleTabsItems() {
      const tabItems = [];
      const nonModelTabIds = [
        'general',
        'hardlinks',
        'size',
        'apiSamples',
      ];
      for (const tabId of nonModelTabIds) {
        if (!this.visibleTabs.includes(tabId)) {
          continue;
        }
        tabItems.push(this.builtInTabItems[tabId]);
      }
      const modelBasedTabItems = this.visibleTabsModels.map(tabModel => {
        // FIXME: create class and reuse instead of extending in loop
        return EmberObject.extend({
          id: reads('tabModel.tabId'),
          name: reads('tabModel.title'),
          statusIcon: reads('tabModel.statusIcon'),
          statusNumber: reads('tabModel.statusNumber'),
          tabClass: reads('tabModel.tabClass'),
          disabled: false,
        }).create({
          tabModel,
        });
      });
      tabItems.push(...modelBasedTabItems);
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

  builtInTabItems: computed(function builtInTabItems() {
    return EmberObject.extend(OwnerInjector, I18n, {
      i18n: service(),

      /**
       * @override
       */
      i18nPrefix: tag`${'fileInfoModal.i18nPrefix'}.tabs`,

      // FIXME: define FileInfoModalTabItem type

      /** @type {FileInfoTabItem} */
      general: computed(function general() {
        return {
          id: 'general',
          name: this.t('general.tabTitle'),
        };
      }),

      /** @type {FileInfoTabItem} */
      hardlinks: computed(
        'fileInfoModal.{hardlinksLimitExceeded,hardlinksLimit,hardlinksCount}',
        function hardlinks() {
          const hardlinksCount = this.fileInfoModal.hardlinksLimitExceeded ?
            `${this.fileInfoModal.hardlinksLimit}+` :
            this.fileInfoModal.hardlinksCount;
          return {
            id: 'hardlinks',
            name: this.t('hardlinks.tabTitle'),
            statusNumber: hardlinksCount,
          };
        }
      ),

      /** @type {FileInfoTabItem} */
      size: computed(
        'fileInfoModal.isSizeStatsDisabled',
        function size() {
          const areStatsDisabled = this.fileInfoModal.isSizeStatsDisabled;
          return {
            id: 'size',
            name: this.t('size.tabTitle'),
            tabClass: areStatsDisabled ? '' : 'tab-status-success',
            statusIcon: areStatsDisabled ? null : 'checkbox-filled',
          };
        }
      ),

      /** @type {FileInfoTabItem} */
      apiSamples: computed(function apiSamples() {
        return {
          id: 'apiSamples',
          name: this.t('apiSamples.tabTitle'),
          icon: 'rest',
        };
      }),
    }).create({
      fileInfoModal: this,
      ownerSource: this,
    });
  }),

  tabModels: computed(function tabModels() {
    return EmberObject.extend({
      tabOptions: reads('fileInfoModal.tabOptions'),
      previewMode: reads('fileInfoModal.previewMode'),
      tabModelFactory: reads('fileInfoModal.tabModelFactory'),

      metadata: computed(
        'tabModelFactory',
        'previewMode',
        'tabOptions.metadata',
        function metadata() {
          return this.tabModelFactory.createTabModel('metadata', {
            previewMode: this.previewMode,
            ...this.tabOptions?.metadata,
          });
        }
      ),

      permissions: computed(
        'tabModelFactory',
        'previewMode',
        'tabOptions.permissions',
        function permissions() {
          return this.tabModelFactory.createTabModel('permissions', {
            readonly: this.previewMode,
            ...this.tabOptions?.permissions,
          });
        }
      ),

      shares: computed(
        'tabModelFactory',
        'tabOptions.shares',
        function shares() {
          return this.tabModelFactory.createTabModel('shares', {
            ...this.tabOptions?.shares,
          });
        }
      ),

      qos: computed(function qos() {
        return this.tabModelFactory.createTabModel('qos');
      }),

      distribution: computed(function distribution() {
        return this.tabModelFactory.createTabModel('distribution');
      }),
    }).create({
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
    if (!this.specialFileTabs.includes(this.activeTab)) {
      return null;
    }
    return this.tabModels[this.activeTab];
  }),

  init() {
    this._super(...arguments);
    const initialTab = this.initialTab;
    const visibleTabs = this.visibleTabs;
    this.set('activeTab', visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0]);
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
        .then((({ hardlinksCount, hardlinks, errors }) =>
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
            hardlinksCount,
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
    getProvidersUrl(...args) {
      return this.get('getProvidersUrl')(...args);
    },
  },
});
