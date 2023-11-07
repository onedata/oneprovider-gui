/**
 * Utils to change order of columns using drag and drop actions.
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
      event.target.closest('th').classList.remove('border-solid');
      this.set('isDropBorderShown', false);
    },
    headingDragOverAction(event) {
      event.preventDefault();
      const lastActiveDropOverElem = event.target.closest('th');
      lastActiveDropOverElem.classList.add('border-solid');

      this.set('lastActiveDropOverElem', lastActiveDropOverElem);
    },
    headingDragLeaveAction() {
      this.lastActiveDropOverElem.classList.remove('border-solid');
    },
  },
});
