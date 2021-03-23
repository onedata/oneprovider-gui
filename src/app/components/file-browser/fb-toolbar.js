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
   * @type {String}
   */
  fileClipboardMode: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  previewMode: false,

  toolbarButtons: computed(
    'allButtonsArray',
    'fileClipboardMode',
    function toolbarButtons() {
      const {
        allButtonsArray,
        fileClipboardMode,
        previewMode,
      } = this.getProperties(
        'allButtonsArray',
        'fileClipboardMode',
        'previewMode'
      );
      let actions = getButtonActions(
        allButtonsArray,
        previewMode ? 'inDirPreview' : 'inDir'
      );
      if (fileClipboardMode !== 'link') {
        actions = actions.reject(({ id }) => ['placeSymlink', 'placeHardlink'].includes(id));
      }
      if (fileClipboardMode !== 'copy' && fileClipboardMode !== 'cut') {
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
      if (get(button, 'disabled')) {
        return;
      }
      this.get('selectCurrentDir')(false);
      return get(button, 'action')();
    },
  },
});
