/**
 * Renders column configuration item with drag and drop icon, checkbox,
 * column name and additional icons.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['column-item'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationPopover.columnItem',

  /**
   * @virtual
   * @type {boolean}
   */
  isMoveUpIconDisabled: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isMoveDownIconDisabled: false,

  /**
   * @virtual
   * @type {string}
   */
  columnName: undefined,

  /**
   * @virtual
   * @type {ColumnProperties}
   */
  columnValue: undefined,

  /**
   * @virtual
   * @type {string}
   */
  translationKey: undefined,

  /**
   * @virtual
   * @type {(columName: string, newValue: boolean) => void}
   */
  checkboxChanged: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  moveColumnDown: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  moveColumnUp: notImplementedWarn,

  /**
   * @virtual
   * @type {() => void}
   */
  dragStartAction: notImplementedIgnore,

  /**
   * @virtual
   * @type {() => void}
   */
  dragEndAction: notImplementedIgnore,

  /**
   * @type {boolean}
   */
  isArrowTooltipVisible: true,

  /**
   * @virtual
   * @type {ComputedProperty<string>}
   */
  checkboxInputId: computed('columnName', function checkboxInputId() {
    return `${this.elementId}-${this.columnName}Checkbox`;
  }),

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
