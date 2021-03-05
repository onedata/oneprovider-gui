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
import { reads } from '@ember/object/computed';
import { conditional, equal, promise, raw, array, tag } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { computed, get } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import { resolve } from 'rsvp';

export default Component.extend(I18n, {
  i18n: service(),
  restGenerator: service(),

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

  typeTranslation: conditional(
    equal('itemType', raw('file')),
    computedT('file'),
    computedT('dir'),
  ),

  fileName: reads('file.name'),

  cdmiObjectId: reads('file.cdmiObjectId'),

  modificationTime: reads('file.modificationTime'),

  fileSize: reads('file.size'),

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

  actions: {
    close() {
      return this.get('onHide')();
    },
  },
});
