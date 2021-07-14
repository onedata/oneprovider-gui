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
import { get, computed, observer } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { cancel, later, schedule } from '@ember/runloop';
import { inject as service } from '@ember/service';
import config from 'ember-get-config';
import _ from 'lodash';
import { array } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['fb-toolbar'],

  media: service(),
  workflowManager: service(),

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
   * @virtual
   * @type {Array<Models.File>}
   */
  fileClipboardFiles: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  previewMode: false,

  /**
   * @type {Boolean}
   */
  isClipboardHintVisible: false,

  /**
   * @type {any}
   */
  clipboardHintHideTimer: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  clipboardHintTargetSelector: computed(
    'elementId',
    'fileClipboardMode',
    function clipboardHintTargetSelector() {
      const {
        elementId,
        fileClipboardMode,
      } = this.getProperties('elementId', 'fileClipboardMode');

      let targetActionName;
      if (fileClipboardMode === 'symlink' || fileClipboardMode === 'hardlink') {
        targetActionName = `place${_.upperFirst(fileClipboardMode)}`;
      } else {
        targetActionName = 'paste';
      }
      return `#${elementId} .file-action-${targetActionName} .one-icon`;
    }
  ),

  toolbarButtons: computed(
    'allButtonsArray',
    'fileClipboardMode',
    'workflowManager.isBagitUploaderAvailable',
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
      const isBagitUploaderAvailable =
        this.get('workflowManager.isBagitUploaderAvailable');
      let actions = getButtonActions(
        allButtonsArray,
        previewMode ? 'inDirPreview' : 'inDir'
      );
      if (fileClipboardMode !== 'symlink') {
        actions = actions.rejectBy('id', 'placeSymlink');
      }
      if (fileClipboardMode !== 'hardlink') {
        actions = actions.rejectBy('id', 'placeHardlink');
      }
      if (fileClipboardMode !== 'copy' && fileClipboardMode !== 'move') {
        actions = actions.rejectBy('id', 'paste');
      }
      if (!isBagitUploaderAvailable) {
        actions = actions.rejectBy('id', 'bagitUpload');
      }
      return actions;
    }
  ),

  highlightedToolbarButtons: array.filter(
    'toolbarButtons',
    btn => ['paste', 'placeSymlink', 'placeHardlink'].includes(get(btn, 'id'))
  ),

  toolbarButtonIds: computed('toolbarButtons.@each.id', function toolbarButtonIds() {
    return this.get('toolbarButtons').mapBy('id');
  }),

  fileClipboardModeObserver: observer(
    'fileClipboardMode',
    'fileClipboardFiles',
    function fileClipboardModeObserver() {
      const {
        isClipboardHintVisible,
        fileClipboardMode,
        clipboardHintHideTimer,
      } = this.getProperties(
        'isClipboardHintVisible',
        'fileClipboardMode',
        'clipboardHintHideTimer'
      );

      cancel(clipboardHintHideTimer);
      if (fileClipboardMode) {
        const timer = later(
          this,
          () => this.set('isClipboardHintVisible', false),
          config.environment === 'test' ? 1 : 7000
        );
        this.setProperties({
          isClipboardHintVisible: true,
          clipboardHintHideTimer: timer,
        });
      } else if (isClipboardHintVisible) {
        this.set('isClipboardHintVisible', false);
      }
    }
  ),

  actions: {
    buttonClicked(button) {
      if (get(button, 'disabled')) {
        return;
      }
      return get(button, 'action')();
    },
    clipboardHintVisibleChange(state) {
      if (!state && this.get('isClipboardHintVisible')) {
        // Must schedule afterRender, because setting it directly is not reflected
        // in template rerender. Even after notifyPropertyChange.
        schedule('afterRender', () => this.set('isClipboardHintVisible', false));
      }
    },
  },
});
