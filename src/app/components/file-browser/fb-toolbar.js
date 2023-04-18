/**
 * Icon buttons with some operations on the currenlty opened directory.
 * Currently there are only operations of creating/uploading new files.
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed, observer } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { cancel, later, schedule } from '@ember/runloop';
import { inject as service } from '@ember/service';
import config from 'ember-get-config';
import _ from 'lodash';
import { array } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['fb-toolbar'],

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
   * @virtual
   * @type {Array<Object|EmberObject>}
   */
  buttons: undefined,

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

  highlightedToolbarButtons: array.filter(
    'buttons',
    btn => ['paste', 'placeSymlink', 'placeHardlink'].includes(get(btn, 'id'))
  ),

  toolbarButtonIds: computed('buttons.@each.id', function toolbarButtonIds() {
    return this.get('buttons').mapBy('id');
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
