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

  /**
   * @type {boolean}
   */
  isDropBorderShown: false,

  /**
   * @type {Object}
   */
  lastActiveDropOverElem: undefined,

  didInsertElement() {
    this._super(...arguments);
    this.browserModel.columnsConfiguration.checkColumnsVisibility();
  },

  moveColumn(index, columnName) {
    this.columnsConfiguration.moveColumn(columnName, index);
    this.columnsConfiguration.saveColumnsOrder();
    this.columnsConfiguration.checkColumnsVisibility();
    this.columnsConfiguration.notifyPropertyChange('columnsOrder');
  },

  actions: {
    dragAction(columnName, event) {
      event.dataTransfer.setData('text', columnName);
      this.set('isDropBorderShown', true);
    },
    dragEndAction() {
      this.set('isDropBorderShown', false);
    },
    dropAction(index, event) {
      const columnName = event.dataTransfer.getData('text');
      this.moveColumn(index + 1, columnName);
      event.target.closest('th').classList.remove('border-solid');
      this.set('isDropBorderShown', false);
    },
    dragOverAction(event) {
      event.preventDefault();
      const lastActiveDropOverElem = event.target.closest('th');
      lastActiveDropOverElem.classList.add('border-solid');

      this.set('lastActiveDropOverElem', lastActiveDropOverElem);
    },
    dragLeaveAction() {
      this.lastActiveDropOverElem.classList.remove('border-solid');
    },

    dragStart() {
      this.browserModel.disableUploadArea();
    },
    dragEnd() {
      this.browserModel.enableUploadArea();
    },
  },
});
