/**
 * Utils to change the order of columns using drag and drop actions.
 *
 * To use that add to table's headers in hbs draggable event handlers:
 * - ondragstart with headingDragAction action assigned to it and pass column name as an argument
 * - ondragend with headingDragEndAction action assigned to it
 *
 * Add also div elements which creates a draggable area, where headers can be dropped,
 * and to that element add event handlers:
 * - ondragover with headingDragOverAction action assigned to it
 * - ondragleave with headingDragLeaveAction action assigned to it
 * - ondrop with headingDropAction action assigned to it and pass an index of column,
 *   in some of the places the first column is not included in the list of columns,
 *   in such case, this index should be incremented by 1.
 *
 * Add drag-and-drop-column-order class to table, to properly show borders and drag icon in headers.
 *
 * Example:
 * ```
 * <table class="drag-and-drop-column-order">
 *  <thead>
 *    <tr>
 *      {{#each visibleColumns as |columnName i|}}
 *        <th
 *          ondragstart={{action "headingDragAction" columnName}}
 *          ondragend={{action "headingDragEndAction"}}
 *        >
 *          <div
 *            class={{concat-classes "left-drop-area" (if isDropBorderShown "drop-area")}}
 *            ondragover={{action "headingDragOverAction" true}}
 *            ondragleave={{action "headingDragLeaveAction"}}
 *            ondrop={{action "headingDropAction" i}}
 *          ></div>
 *          <div
 *            class={{concat-classes "right-drop-area" (if isDropBorderShown "drop-area")}}
 *            ondragover={{action "headingDragOverAction" false}}
 *            ondragleave={{action "headingDragLeaveAction"}}
 *            ondrop={{action "headingDropAction" (add i 1)}}
 *          ></div>
 *        </th>
 *      {{/each}}
 *      ...
 * ```
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';

export default Mixin.create({
  /**
   * @virtual
   * @type {Utils.ColumnsConfiguration}
   */
  columnsConfiguration: undefined,

  /**
   * @type {boolean}
   */
  isDropBorderShown: false,

  /**
   * @type {HTMLElement}
   */
  lastActiveDropOverElem: undefined,

  moveColumn(index, columnName) {
    this.columnsConfiguration.moveColumn(columnName, index);
    this.columnsConfiguration.saveColumnsOrder();
    this.columnsConfiguration.checkColumnsVisibility();
    this.columnsConfiguration.notifyPropertyChange('columnsOrder');
  },

  actions: {
    headingDragAction(columnName, event) {
      event.dataTransfer.setData('text', columnName);
      this.set('isDropBorderShown', true);
    },
    headingDragEndAction() {
      this.set('isDropBorderShown', false);
    },
    headingDropAction(index, event) {
      const columnName = event.dataTransfer.getData('text');
      this.moveColumn(index, columnName);
      event.target.closest('th').classList.remove('left-border-solid');
      event.target.closest('th').classList.remove('right-border-solid');
      this.set('isDropBorderShown', false);
    },
    headingDragOverAction(isLeftBorder, event) {
      event.preventDefault();
      const lastActiveDropOverElem = event.target.closest('th');
      if (isLeftBorder) {
        lastActiveDropOverElem.classList.add('left-border-solid');
      } else {
        lastActiveDropOverElem.classList.add('right-border-solid');
      }

      this.set('lastActiveDropOverElem', lastActiveDropOverElem);
    },
    headingDragLeaveAction(event) {
      event.target.closest('th').classList.remove('left-border-solid');
      event.target.closest('th').classList.remove('right-border-solid');
    },
  },
});
