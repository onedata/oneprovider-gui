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
import DragAndDropColumnOrderMixin from 'oneprovider-gui/mixins/drag-and-drop-column-order';

const mixins = [
  I18n,
  DragAndDropColumnOrderMixin,
];

export default Component.extend(...mixins, {
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

  didInsertElement() {
    this._super(...arguments);
    this.browserModel.columnsConfiguration.checkColumnsVisibility();
  },

  actions: {
    checkboxDragStart() {
      this.browserModel.disableUploadArea();
    },
    checkboxDragEnd() {
      this.browserModel.enableUploadArea();
    },
  },
});
