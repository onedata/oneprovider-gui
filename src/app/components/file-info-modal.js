/**
 * Modal with detailed views about file or directory.
 *
 * Evolved from simple `file-browser/fb-info-modal` component.
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
import { promise, raw, or, gt, and, notEqual, collect, bool } from 'ember-awesome-macros';
import { computed, get, getProperties } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled, Promise } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { next } from '@ember/runloop';
import { extractDataFromPrefixedSymlinkPath } from 'oneprovider-gui/utils/symlink-utils';
import _ from 'lodash';
import TabModelFactory from 'oneprovider-gui/utils/file-info/tab-model-factory';

const mixins = [
  I18n,
  createDataProxyMixin('fileHardlinks'),
];

export default Component.extend(...mixins, {
  i18n: service(),
  fileManager: service(),
  errorExtractor: service(),
  spaceManager: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.fileInfoModal',

  /**
   * @virtual
   * @type {models/file}
   */
  file: undefined,

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
   * One of: general, hardlinks, size, apiSamples
   * @type {String}
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

  showApiSection: reads('previewMode'),

  itemType: reads('file.type'),

  typeTranslation: computed('itemType', function typeTranslation() {
    return _.upperFirst(this.t(`fileType.${this.get('itemType')}`, {}, {
      defaultValue: this.t('fileType.file'),
    }));
  }),

  fileName: reads('file.name'),

  apiSamplesProxy: promise.object(computed(function apiSamples() {
    const fileId = this.get('file.entityId');
    return this.get('fileManager').getFileApiSamples(fileId, 'public');
  })),

  apiSamples: reads('apiSamplesProxy.content'),

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
  isSizeTabDisabled: computed(
    'dirStatsServiceStatus',
    'itemType',
    function isSizeTabDisabled() {
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

  ownerFullNameProxy: promise.object(
    computed('file.owner', function ownerFullNamePromise() {
      const ownerProxy = this.get('file.owner');
      if (ownerProxy) {
        return ownerProxy.then(owner => owner && get(owner, 'fullName'));
      } else {
        return resolve('—');
      }
    })
  ),

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
  isHardlinksTabVisible: gt('hardlinksCount', raw(1)),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSizeTabVisible: computed(
    'previewMode',
    'file.effFile.type',
    function isSizeTabVisible() {
      const previewMode = this.get('previewMode');
      const effItemType = this.get('file.effFile.type');
      return !previewMode && effItemType !== 'file';
    }
  ),

  isApiSamplesTabVisible: and('showApiSection', notEqual('itemType', raw('symlink'))),

  // TODO: VFS-9628 this is a temporary list of tabs moved from separate modals
  specialFileTabs: Object.freeze(['metadata']),

  visibleTabs: computed(
    'isHardlinksTabVisible',
    'isSizeTabVisible',
    'isApiSamplesTabVisible',
    function visibleTabs() {
      const tabs = ['general'];
      if (this.isHardlinksTabVisible) {
        tabs.push('hardlinks');
      }
      if (this.isSizeTabVisible) {
        tabs.push('size');
      }
      if (this.isApiSamplesTabVisible) {
        tabs.push('apiSamples');
      }
      tabs.push(...this.specialFileTabs);
      return tabs;
    },
  ),

  // TODO: VFS-9628 will contain all tab models after refactor
  visibleTabsModels: collect('metadataTabModel'),

  metadataTabModel: computed(function metadataTabModel() {
    return this.tabModelFactory.createTabModel('metadata');
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
    return this[`${this.activeTab}TabModel`];
  }),

  init() {
    this._super(...arguments);
    const initialTab = this.initialTab;
    if (this.visibleTabs.includes(initialTab)) {
      this.activeTab = initialTab;
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

  actions: {
    close() {
      return this.get('onHide')();
    },
  },
});
