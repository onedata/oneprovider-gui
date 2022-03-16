/**
 * Show basic information about file or directory
 *
 * @module components/file-browser/fb-info-modal
 * @author Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { reads } from '@ember/object/computed';
import { conditional, equal, promise, raw, array, tag, or, gt } from 'ember-awesome-macros';
import { computed, get, getProperties } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled, Promise } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { next } from '@ember/runloop';
import { extractDataFromPrefixedSymlinkPath } from 'oneprovider-gui/utils/symlink-utils';
import _ from 'lodash';

export default Component.extend(I18n, createDataProxyMixin('fileHardlinks'), {
  i18n: service(),
  restApiGenerator: service(),
  xrootdApiGenerator: service(),
  fileManager: service(),
  errorExtractor: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbInfoModal',

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
   * One of: general, hardlinks, size
   * @type {String}
   */
  activeTab: 'general',

  /**
   * If true, whole content will take up smaller amount of space
   * @type {boolean}
   */
  smallContent: true,

  /**
   * If true, info about REST URL is opened
   * @type {Boolean}
   */
  apiCommandTypeInfoOpened: false,

  /**
   * For available values see: `commonRestUrlTypes` and `availableRestUrlCommands`
   * @type {String}
   */
  selectedRestUrlType: null,

  selectedApiCommand: null,

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

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isXrootdApiAvailable: computed('share.hasHandle', function isXrootdApiAvailable() {
    const {
      share,
      xrootdApiGenerator,
    } = this.getProperties('share', 'xrootdApiGenerator');
    if (share) {
      return xrootdApiGenerator.isAvailableFor({ share });
    }
  }),

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
   * ID for API command info trigger (hint about API commands)
   * @type {ComputedProperty<String>}
   */
  apiCommandInfoTriggerId: tag `${'elementId'}-api-command-type-info-trigger`,

  /**
   * @type {ComputedProperty<String>}
   */
  selectedApiCommandString: computed(
    'effSelectedApiCommand',
    'cdmiObjectId',
    'spaceId',
    'share',
    'filePath',
    function selectedApiCommandString() {
      const {
        restApiGenerator,
        xrootdApiGenerator,
        effSelectedApiCommand,
        cdmiObjectId,
        spaceId,
        share,
        filePath,
      } = this.getProperties(
        'restApiGenerator',
        'xrootdApiGenerator',
        'effSelectedApiCommand',
        'cdmiObjectId',
        'spaceId',
        'share',
        'filePath',
      );
      const generator = {
        rest: restApiGenerator,
        xrootd: xrootdApiGenerator,
      } [effSelectedApiCommand.type];
      if (!generator) {
        console.error(
          `component:file-browser/fb-info-modal#selectedApiCommandString: no generator for type: ${effSelectedApiCommand.type}`
        );
        return '';
      }

      const shareId = get(share, 'entityId');
      if (generator[effSelectedApiCommand.id]) {
        return generator[effSelectedApiCommand.id]({
          cdmiObjectId,
          spaceId,
          shareId,
          path: filePath,
        });
      } else {
        console.error(
          `component:file-browser/fb-info-modal#selectedApiCommandString: no such generator method: ${effSelectedApiCommand.id}`
        );
        return '';
      }
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  cdmiRowId: computed('elementId', function cdmiRowId() {
    return this.get('elementId') + '-row-cdmi';
  }),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  commonRestUrlTypes: raw([
    'getSharedFileAttributes',
    'getSharedFileExtendedAttributes',
    'getSharedFileJsonMetadata',
    'getSharedFileRdfMetadata',
  ]),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  availableRestUrlCommands: array.concat(
    conditional(
      equal('itemType', raw('dir')),
      raw(['listSharedDirectoryChildren', 'downloadSharedDirectoryContent']),
      raw(['downloadSharedFileContent']),
    ),
    'commonRestUrlTypes'
  ),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  availableXrootdCommandIds: conditional(
    'isXrootdApiAvailable',
    conditional(
      equal('itemType', raw('dir')),
      raw(['listSharedDirectoryChildren', 'downloadSharedDirectoryContent']),
      raw(['downloadSharedFileContent']),
    ),
    raw([]),
  ),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  availableApiCommands: computed(
    'availableRestUrlCommands.[]',
    'availableXrootdCommandIds.[]',
    function availableApiCommands() {
      const {
        availableRestUrlCommands,
        availableXrootdCommandIds,
      } = this.getProperties('availableRestUrlCommands', 'availableXrootdCommandIds');
      return [
        ...availableRestUrlCommands.map(id => ({ type: 'rest', id })),
        ...availableXrootdCommandIds.map(id => ({ type: 'xrootd', id })),
      ];
    }
  ),

  /**
   * Readonly property with valid name of REST URL type to display.
   * Set `selectedRestUrlType` property to change its value.
   * @type {ComputedProperty<String>}
   */
  effSelectedRestUrlType: conditional(
    array.includes('availableRestUrlCommands', 'selectedRestUrlType'),
    'selectedRestUrlType',
    'availableRestUrlCommands.firstObject',
  ),

  /**
   * Readonly property with valid API command specification to display.
   * Set `selectedApiComman` property to change its value.
   * @type {ComputedProperty<Object>}
   */
  effSelectedApiCommand: conditional(
    array.includes('availableApiCommands', 'selectedApiCommand'),
    'selectedApiCommand',
    'availableApiCommands.firstObject',
  ),

  init() {
    this._super(...arguments);
    const initialTab = this.get('initialTab');
    if (['general', 'hardlinks', 'size'].includes(initialTab)) {
      this.set('activeTab', initialTab);
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

  tabsSpec: computed(
    'itemType',
    'file.effFile.type',
    'hardlinksLimitExceeded',
    'hardlinksLimit',
    'hardlinksCount',
    function tabsSpec() {
      const {
        itemType,
        hardlinksLimitExceeded,
        hardlinksLimit,
        hardlinksCount,
      } = this.getProperties(
        'itemType',
        'hardlinksLimitExceeded',
        'hardlinksLimit',
        'hardlinksCount'
      );
      const effItemType = this.get('file.effFile.type');
      return [{
          id: 'general',
          label: this.t('tabs.general.tabTitle'),
          disabled: false,
          show: true,
        },
        {
          id: 'hardlinks',
          label: this.t('tabs.hardlinks.tabTitle', {
            hardlinksCount: (hardlinksLimitExceeded ?
              hardlinksLimit + '+' :
              hardlinksCount
            ),
          }),
          disabled: false,
          show: (hardlinksCount > 1),
        },
        {
          id: 'size',
          label: this.t('tabs.size.tabTitle'),
          disabledTip: this.t('tabs.size.disabledTip'),
          disabled: (itemType === 'symlink'),
          show: (effItemType !== 'file'),
        },
      ];
    }
  ),

  actions: {
    changeTab(tab) {
      this.set('activeTab', tab);
    },
    close() {
      return this.get('onHide')();
    },
    selectApiCommand(apiCommand) {
      this.set('selectedApiCommand', apiCommand);
    },
  },
});
