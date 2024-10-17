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
import { reads } from '@ember/object/computed';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['column-item'],

  i18n: service(),
  providerManager: service(),

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
   * @type {number}
   */
  columnNumber: undefined,

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
   * @type {(columnName: string) => void}
   */
  openXattrModification: notImplementedWarn,

  /**
   * @virtual
   * @type {(columnName: string) => void}
   */
  removeXattrColumn: notImplementedWarn,

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
   * @virtual
   * @type {(index: number, event: Object) => void }
   */
  acceptDraggedElement: notImplementedIgnore,

  /**
   * @virtual
   * @type {boolean}
   */
  isColumnListVisible: false,

  /**
   * @type {boolean}
   */
  isDropBorderShown: false,

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

  /**
   * @type {PromiseObject<Models.Provider>}
   */
  currentProviderProxy: computed(function currentProviderProxy() {
    return promiseObject(this.providerManager.getCurrentProvider());
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  currentProviderName: reads('currentProviderProxy.content.name'),

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
    dragStartAction(columnName, event) {
      this.set('isDropBorderShown', true);
      event.dataTransfer.setData('text', columnName);
      if (this.dragStartAction) {
        return this.dragStartAction();
      }
    },
    dragEndAction() {
      this.set('isDropBorderShown', false);
      if (this.dragEndAction) {
        return this.dragEndAction();
      }
    },
    headingDragOverAction(isLeftBorder, event) {
      event.preventDefault();
      const lastActiveDropOverElem = event.target.closest('li');
      if (isLeftBorder) {
        lastActiveDropOverElem.classList.add('top-border-area');
      } else {
        lastActiveDropOverElem.classList.add('bottom-border-area');
      }
    },
    headingDragLeaveAction(event) {
      event.target.closest('li').classList.remove('top-border-area');
      event.target.closest('li').classList.remove('bottom-border-area');
    },
    acceptDraggedElement(index, event) {
      this.set('isDropBorderShown', false);
      event.target.closest('li').classList.remove('top-border-area');
      event.target.closest('li').classList.remove('bottom-border-area');
      return this.acceptDraggedElement(index, event);
    },
    openXattrModification(columnName) {
      this.openXattrModification(columnName);
    },
    removeXattrColumn(columnName) {
      this.removeXattrColumn(columnName);
    },
  },
});
