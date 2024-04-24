/**
 * First cell of file browser table header (thead)
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import DragAndDropColumnOrderMixin from 'oneprovider-gui/mixins/drag-and-drop-column-order';
import { reads } from '@ember/object/computed';

const mixins = [
  I18n,
  DragAndDropColumnOrderMixin,
];

export default Component.extend(...mixins, {
  tagName: 'th',
  classNameBindings: [
    'browserModel.firstColumnClass',
    'isDropBorderShown:border-dashed',
  ],

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
   * @type {boolean}
   */
  isDropBorderShown: false,

  actions: {
    checkboxDragStart() {
      this.browserModel.disableUploadArea();
    },
    checkboxDragEnd() {
      this.browserModel.enableUploadArea();
    },
    headingDragAction(columnName, event) {
      if (!this.browserModel.readonlyFilesystem) {
        this.browserModel.disableUploadArea();
      }
      event.dataTransfer.setData('text', columnName);

      this.set('isDropBorderShown', true);
    },
    headingDragEndAction() {
      if (!this.browserModel.readonlyFilesystem) {
        this.browserModel.enableUploadArea();
      }
      this.set('isDropBorderShown', false);
    },
  },
});
