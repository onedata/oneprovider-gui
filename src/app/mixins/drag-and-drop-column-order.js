/**
 * Utils to change the order of columns using drag and drop actions.
 *
 * To use that add to table's headers in hbs draggable event handlers:
 * - ondragstart with headingDrag action assigned to it and pass column name as an argument
 * - ondragend with headingDragEnd action assigned to it
 *
 * Add also div elements which creates a draggable area, where headers can be dropped,
 * and to that element add event handlers:
 * - ondragover with headingDragOver action assigned to it
 * - ondragleave with headingDragLeave action assigned to it
 * - ondrop with headingDrop action assigned to it and pass an index of column,
 *   in some of the places the first column is not included in the list of columns,
 *   in such case, this index should be incremented by 1.
 *
 * Add drag-and-drop-column-order class to table, to properly show borders and drag icon in headers.
 * It is also possible for a list, in which case you should override 'dragAndDropTagName'.
 *
 * Example:
 * ```
 * <table class="drag-and-drop-column-order">
 *  <thead>
 *    <tr>
 *      {{#each visibleColumns as |columnName i|}}
 *        <th
 *          ondragstart={{action "headingDrag" columnName}}
 *          ondragend={{action "headingDragEnd"}}
 *        >
 *          <div
 *            class={{concat-classes "before-drop-area" (if isDropBorderShown "drop-area")}}
 *            ondragover={{action "headingDragOver" true}}
 *            ondragleave={{action "headingDragLeave"}}
 *            ondrop={{action "headingDrop" i}}
 *          ></div>
 *          <div
 *            class={{concat-classes "after-drop-area" (if isDropBorderShown "drop-area")}}
 *            ondragover={{action "headingDragOver" false}}
 *            ondragleave={{action "headingDragLeave"}}
 *            ondrop={{action "headingDrop" (add i 1)}}
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

  /**
   * @type {string}
   */
  dragAndDropTagName: 'th',

  moveColumn(index, columnName) {
    this.columnsConfiguration.moveColumn(columnName, index);
    this.columnsConfiguration.saveColumnsOrder();
    this.columnsConfiguration.checkColumnsVisibility();
    this.columnsConfiguration.notifyPropertyChange('columnsOrder');
  },

  actions: {
    headingDrag(columnName, event) {
      event.dataTransfer.setData('text', columnName);
      event.dataTransfer.effectAllowed = 'move';
      this.set('isDropBorderShown', true);
    },
    headingDragEnd() {
      this.set('isDropBorderShown', false);
    },
    headingDrop(index, event) {
      const columnName = event.dataTransfer.getData('text');
      this.moveColumn(index, columnName);
      event.target.closest(this.dragAndDropTagName).classList.remove(
        'before-drag-over-border',
        'after-drag-over-border',
      );
      this.set('isDropBorderShown', false);
    },
    headingDragOver(isOverBeforeArea, event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const lastActiveDropOverElem = event.target.closest(this.dragAndDropTagName);
      lastActiveDropOverElem.classList.add(
        isOverBeforeArea ? 'before-drag-over-border' : 'after-drag-over-border'
      );

      this.set('lastActiveDropOverElem', lastActiveDropOverElem);
    },
    headingDragLeave(event) {
      event.target.closest(this.dragAndDropTagName).classList.remove(
        'before-drag-over-border',
        'after-drag-over-border',
      );
    },
  },
});
