/**
 * Content for Xattrs (aka Basic) metadata tab in file metadata modal: key-value editor
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import config from 'ember-get-config';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { emptyValue } from 'oneprovider-gui/utils/file-metadata-view-model';
import { conditional, eq, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';

const {
  layoutConfig,
} = config;

const invalidKeyRegex = /(onedata|cdmi)_.*/;

export default Component.extend(I18n, {
  layoutConfig,
  classNames: ['file-metadata-xattrs'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.xattrs',

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

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  areXattrsValid: true,

  /**
   * TODO: VFS-9695 A hack to force re-generate editor values when this property changes,
   * special for non-refactored qos-params-editor (used for xattrs editor).
   * @virtual optional
   * @type {number}
   */
  lastResetTime: undefined,

  metadataForEditor: conditional(
    eq('metadata', raw(emptyValue)),
    raw({}),
    'metadata'
  ),

  /**
   * Metadata converted to array of `{ key, value }` objects
   * @type {ComputedProperty<Array>}
   */
  metadataForPreview: computed('metadataForEditor', function metadataForPreview() {
    const metadataForEditor = this.get('metadataForEditor');
    return Object.keys(metadataForEditor).map(key => ({
      key,
      value: metadataForEditor[key],
    }));
  }),

  actions: {
    xattrsChanged({ isValid, qosParams: xattrs }) {
      this.get('metadataChanged')({
        type: 'xattrs',
        isValid,
        metadata: _.isEmpty(xattrs) ? emptyValue : _.cloneDeep(xattrs),
      });
    },
    validateKey(key) {
      return invalidKeyRegex.test(key || '') ? this.t('validation.reservedKey') : null;
    },
  },
});
