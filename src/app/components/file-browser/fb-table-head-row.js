/**
 * Row of file browser table header (thead)
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { reads } from '@ember/object/computed';
import DragAndDropColumnOrderMixin from 'oneprovider-gui/mixins/drag-and-drop-column-order';

const mixins = [
  I18n,
  DragAndDropColumnOrderMixin,
];

export default Component.extend(...mixins, {
  tagName: 'tr',
  classNameBindings: ['browserModel.headRowClass'],

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
   * @type {string}
   */
  headFirstCellComponentName: undefined,

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
      // Invoked when item in columns configuration popover drag is started
      // only when browserModel.isUsingUploadArea is true
    },
    checkboxDragEnd() {
      // Invoked when item in columns configuration popover drag is ended
      // only when browserModel.isUsingUploadArea is true
    },
    headingDragAction(columnName, event) {
      event.dataTransfer.setData('text', columnName);

      this.set('isDropBorderShown', true);
    },
    headingDragEndAction() {
      this.set('isDropBorderShown', false);
    },
  },
});
