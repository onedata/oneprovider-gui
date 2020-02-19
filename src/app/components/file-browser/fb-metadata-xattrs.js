/**
 * Content for Xattrs (aka Basic) metadata tab in file metadata modal: key-value editor
 * 
 * @module components/file-browser/fb-metadata-xattrs
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import config from 'ember-get-config';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { emptyValue } from 'oneprovider-gui/components/file-browser/fb-metadata-modal';
import { conditional, eq, raw } from 'ember-awesome-macros';

const {
  layoutConfig,
} = config;

const invalidKeyRegex = /(onedata|cdmi)_.*/;

export default Component.extend(I18n, {
  classNames: ['fb-metadata-xattrs'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbMetadataXattrs',

  /**
   * @virtual
   * Object with `xattr_key: xattr_value`
   */
  metadata: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  metadataChanged: undefined,

  layoutConfig,

  areXattrsValid: true,

  metadataForEditor: conditional(
    eq('metadata', raw(emptyValue)),
    raw({}),
    'metadata'
  ),

  actions: {
    xattrsChanged({ isValid, qosParams: xattrs }) {
      this.get('metadataChanged')({
        type: 'xattrs',
        isValid,
        metadata: _.cloneDeep(xattrs),
      });
    },
    disableEnterKey(keyEvent) {
      if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
      }
    },
    validateKey(key) {
      return invalidKeyRegex.test(key || '') ? this.t('validation.reservedKey') : null;
    },
  },
});
