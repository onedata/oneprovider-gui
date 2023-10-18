/**
 * Renders column configuration checkbox.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['column-configuration-checkbox'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationCheckbox',

  /**
   * @virtual
   * @type {boolean}
   */
  isDisabledMoveUpIcon: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isDisabledMoveDownIcon: false,

  /**
   * @type {boolean}
   */
  arrowTooltipVisible: true,

  actions: {
    checkboxChanged(columnName, newValue) {
      return this.checkboxChanged(columnName, newValue);
    },
    moveColumnDown(columnName) {
      return this.moveColumnDown(columnName);
    },
    moveColumnUp(columnName) {
      return this.moveColumnUp(columnName);
    },
    dragStartAction() {
      if (this.dragStartAction) {
        return this.dragStartAction();
      }
    },
    dragEndAction() {
      if (this.dragEndAction) {
        return this.dragEndAction();
      }
    },
  },
});
