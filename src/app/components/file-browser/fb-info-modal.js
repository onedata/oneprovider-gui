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
import { conditional, equal, promise, raw, array, tag, or } from 'ember-awesome-macros';
import { computed, get, getProperties } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled, Promise } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import sortByProperties from 'onedata-gui-common/utils/ember/sort-by-properties';
import { next } from '@ember/runloop';
import { extractDataFromPrefixedSymlinkPath } from 'oneprovider-gui/utils/symlink-utils';
import _ from 'lodash';

export default Component.extend(I18n, createDataProxyMixin('fileHardlinks'), {
  i18n: service(),
  restGenerator: service(),
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
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * Possible values the same as for `activeTab` property
   * @virtual optional
   * @type {String}
   */
  initialTab: undefined,

  /**
   * One of: general, hardlinks
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
  restUrlTypeInfoOpened: false,

  /**
   * For available values see: `commonRestUrlTypes` and `availableRestUrlTypes`
   * @type {String}
   */
  selectedRestUrlType: null,

  itemType: reads('file.type'),

  typeTranslation: computed('itemType', function typeTranslation() {
    return _.upperFirst(this.t(`fileType.${this.get('itemType')}`, {}, {
      defaultValue: this.t('fileType.file'),
    }));
  }),

  fileName: reads('file.name'),

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

  /**
   * ID for REST URL info trigger (hint about REST methods)
   * @type {ComputedProperty<String>}
   */
  restUrlInfoTriggerId: tag `${'elementId'}-rest-url-type-info-trigger`,

  /**
   * @type {ComputedProperty<String>}
   */
  publicRestUrl: computed(
    'effSelectedRestUrlType',
    'cdmiObjectId',
    function publicRestUrl() {
      const {
        restGenerator,
        effSelectedRestUrlType,
        cdmiObjectId,
      } = this.getProperties('restGenerator', 'effSelectedRestUrlType', 'cdmiObjectId');
      if (restGenerator[effSelectedRestUrlType]) {
        return restGenerator[effSelectedRestUrlType](cdmiObjectId);
      } else {
        console.error(
          `component:file-browser/fb-info-modal#publicRestUrl: no such restGenerator method: ${effSelectedRestUrlType}`
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
  availableRestUrlTypes: array.concat(
    conditional(
      equal('itemType', raw('dir')),
      raw(['listSharedDirectoryChildren']),
      raw(['downloadSharedFileContent']),
    ),
    'commonRestUrlTypes'
  ),

  /**
   * Readonly property with valid name of REST URL type to display.
   * Set `selectedRestUrlType` property to change its value.
   * @type {ComputedProperty<String>}
   */
  effSelectedRestUrlType: conditional(
    array.includes('availableRestUrlTypes', 'selectedRestUrlType'),
    'selectedRestUrlType',
    'availableRestUrlTypes.firstObject',
  ),

  init() {
    this._super(...arguments);
    const initialTab = this.get('initialTab');
    if (['general', 'hardlinks'].includes(initialTab)) {
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
    } = this.getProperties('previewMode', 'fileManager', 'getDataUrl');

    if (previewMode) {
      return resolve([]);
    }
    return new Promise(resolvePromise => {
      // Moving it to next runloop frame as it may trigger double-render error
      // of tabs.
      next(() => resolvePromise(
        fileManager.getFileHardlinks(this.get('file.entityId'))
        .then((({ hardlinksCount, hardlinks, errors }) =>
          allFulfilled(hardlinks.map(hardlinkFile =>
            resolveFilePath(hardlinkFile)
            .then(path => stringifyFilePath(path))
            .catch(() => null)
            .then(path => ({
              file: hardlinkFile,
              fileUrl: getDataUrl({
                fileId: null,
                selected: [get(hardlinkFile, 'entityId')],
              }),
              path,
            }))
          )).then(newHardlinks => ({
            hardlinksCount,
            hardlinks: sortByProperties(newHardlinks, ['file.name', 'path']),
            errors,
          }))
        ))
      ));
    });
  },

  actions: {
    changeTab(tab) {
      this.set('activeTab', tab);
    },
    close() {
      return this.get('onHide')();
    },
  },
});
