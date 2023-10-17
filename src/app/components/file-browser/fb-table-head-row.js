/**
 * Row of file browser table header (thead)
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['fb-table-head-row'],

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @type {ComputedProperty<Utils.ColumnsConfiguration>}
   */
  columnsConfiguration: reads('browserModel.columnsConfiguration'),

  isHasBorder: false,

  elem: undefined,

  didInsertElement() {
    this._super(...arguments);
    this.browserModel.columnsConfiguration.checkColumnsVisibility();
  },

  actions: {
    acceptDraggedElement(index, draggedElement) {
      this.columnsConfiguration.moveColumn(draggedElement.columnName, index + 1);
      this.columnsConfiguration.saveColumnsOrder();
      this.columnsConfiguration.checkColumnsVisibility();
      this.columnsConfiguration.notifyPropertyChange('columnsOrder');
    },
    dragAction(columnName, event) {
      this.browserModel.disableUploadArea();
      event.dataTransfer.setData('text', columnName);
      this.set('isHasBorder', true);
    },
    dragEndAction() {
      this.browserModel.enableUploadArea();
      this.set('isHasBorder', false);
    },
    dropAction(index, event) {
      event.preventDefault();

      const columnName = event.dataTransfer.getData('text');
      this.columnsConfiguration.moveColumn(columnName, index + 1);
      this.columnsConfiguration.saveColumnsOrder();
      this.columnsConfiguration.checkColumnsVisibility();
      this.columnsConfiguration.notifyPropertyChange('columnsOrder');
      event.target.closest('th').classList.remove('border-true');
      this.set('isHasBorder', false);
    },
    dragOverAction(event) {
      const elem = event.target.closest('th');
      elem.classList.add('border-true');

      this.set('elem', elem);
    },
    dragOutAction() {
      this.elem.classList.remove('border-true');
    },

    dragStart() {
      this.browserModel.disableUploadArea();
    },
    dragEnd() {
      this.browserModel.enableUploadArea();
    },
  },
});
