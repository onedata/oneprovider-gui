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
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

export default Component.extend(I18n, {
  classNames: ['fb-toolbar'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbToolbar',

  dir: undefined,

  /**
   * @virtual
   */
  selectCurrentDir: notImplementedReject,

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

  /**
   * @virtual
   * @type {boolean}
   */
  clipboardReady: undefined,

  moreToolsOpen: false,

  // TODO: title should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  toolbarButtons: computed(
    'allButtonsArray',
    'clipboardReady',
    function toolbarButtons() {
      const {
        allButtonsArray,
        clipboardReady,
      } = this.getProperties('allButtonsArray', 'clipboardReady');
      let actions = getButtonActions(allButtonsArray, 'inDir');
      if (!clipboardReady) {
        actions = actions.rejectBy('id', 'paste');
      }
      return actions;
    }
  ),

  toolbarButtonIds: computed('toolbarButtons.@each.id', function toolbarButtonIds() {
    return this.get('toolbarButtons').mapBy('id');
  }),

  actions: {
    buttonClicked(button) {
      this.get('selectCurrentDir')();
      return get(button, 'action')();
    },
  },
});
