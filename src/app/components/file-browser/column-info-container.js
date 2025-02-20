/**
 * Show the content of the header cell, such as the name, subname,
 * and an info icon with a tooltip.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2025 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  tagName: 'div',
  classNames: ['column-info-container'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: reads('browserModel.headRowTranslation'),

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {ColumnProperties}
   */
  columnInfo: undefined,

  /**
   * @virtual
   * @type {SafeString}
   */
  columnStyle: undefined,

  /**
   * @virtual
   * @type {string}
   */
  columnName: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  previewMode: false,

  /**
   * @virtual
   * @type {string}
   */
  currentProviderName: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isMetadataColumn: computed('columnInfo.type', function isMetadataColumn() {
    return this.columnInfo.type === 'xattr' || this.columnInfo.type === 'json';
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  tooltipText: computed(
    'columnInfo.{type,queryType,xattrKey}',
    'columnName',
    'previewMode',
    'currentProviderName',
    function tooltipText() {
      if (this.columnInfo.type === 'xattr') {
        return this.t('headers.tip.xattr', { key: this.columnInfo.xattrKey });
      } else if (this.columnInfo.type === 'json') {
        if (this.columnInfo.queryType === 'all') {
          return this.t('headers.tip.json.all');
        } else {
          return this.t('headers.tip.json.key', { key: this.columnInfo.jsonKey });
        }
      } else if (this.columnName === 'fileId') {
        const scope = this.previewMode ? 'public' : 'priv';
        return this.t(`headers.tip.${this.columnName}.${scope}`);
      } else {
        return this.t(
          `headers.tip.${this.columnName}`, { oneprovider: this.currentProviderName }
        );
      }
    }
  ),
});
