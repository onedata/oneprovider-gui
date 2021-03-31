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
import { computed, get } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import sortByProperties from 'onedata-gui-common/utils/ember/sort-by-properties';

export default Component.extend(I18n, createDataProxyMixin('fileReferences'), {
  i18n: service(),
  restGenerator: service(),
  fileManager: service(),

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
   * @type {string}
   */
  spaceEntityId: undefined,

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
    return this.t(this.get('itemType'), {}, { defaultValue: this.t('file') });
  }),

  fileName: reads('file.name'),

  cdmiObjectId: reads('file.cdmiObjectId'),

  modificationTime: reads('file.modificationTime'),

  fileSize: reads('file.size'),

  referencesCount: or('file.referencesCount', raw(1)),

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

  fetchFileReferences() {
    const {
      previewMode,
      fileManager,
      getDataUrl,
    } = this.getProperties('previewMode', 'fileManager', 'getDataUrl');

    if (previewMode) {
      return resolve([]);
    }
    return fileManager.getFileReferences(this.get('file.entityId'))
      .then((({ referencesCount, references }) =>
        allFulfilled(references.map(referenceFile =>
          resolveFilePath(referenceFile)
          .then(path => stringifyFilePath(path))
          .catch(() => null)
          .then(path => ({
            file: referenceFile,
            fileUrl: getDataUrl({
              fileId: null,
              selected: [get(referenceFile, 'entityId')],
            }),
            path,
          }))
        )).then(newReferences => ({
          referencesCount,
          references: sortByProperties(newReferences, ['file.name', 'path']),
        }))
      ));
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
