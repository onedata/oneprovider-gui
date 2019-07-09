/**
 * Icon buttons with some operations on the currenlty opened directory.
 * Currently there are only operations of creating/uploading new files.
 * 
 * @module components/file-browser/fb-toolbar
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';

export default Component.extend(I18n, {
  classNames: ['fb-toolbar'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbToolbar',

  dir: undefined,

  /**
   * @virtual
   * @type {Array<object>}
   */
  allButtonsArray: undefined,

  /**
   * @virtual
   * @type {string}
   */
  selectionContext: 'none',

  moreToolsOpen: false,

  // TODO: title should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  toolbarButtons: computed('allButtonsArray', function toolbarButtons() {
    return getButtonActions(this.get('allButtonsArray'), 'inDir');
  }),

  toolbarButtonIds: computed('toolbarButtons.@each.id', function toolbarButtonIds() {
    return this.get('toolbarButtons').mapBy('id');
  }),

  actions: {
    buttonClicked(button) {
      return get(button, 'action')();
    },
    toggleMoreTools(open) {
      this.set('moreToolsOpen', open);
    },
  },
});
