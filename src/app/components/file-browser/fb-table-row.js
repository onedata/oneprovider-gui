/**
 * Single file/directory row in files list.
 * 
 * @module components/file-browser/fb-table-row
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads, not } from '@ember/object/computed';
import { get, computed, getProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import { later, cancel } from '@ember/runloop';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import FastDoubleClick from 'onedata-gui-common/mixins/components/fast-double-click';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

function isEventFromMenuToggle(event) {
  return event.target.matches('.one-menu-toggle, .one-menu-toggle *');
}

export default Component.extend(I18n, FastDoubleClick, {
  tagName: 'tr',
  classNames: ['fb-table-row', 'menu-toggle-hover-parent'],
  classNameBindings: [
    'typeClass',
    'isSelected:file-selected',
    'fileCut:file-cut',
    'isInvalidated:is-invalidated',
  ],
  attributeBindings: ['fileEntityId:data-row-id'],

  errorExtractor: service(),
  media: service(),
  visualLogger: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTableRow',

  /**
   * @override
   * Prevent adding pointer style
   */
  ignoreTouchAction: true,

  /**
   * @virtual
   */
  file: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  openContextMenu: notImplementedThrow,

  /**
   * @virtual
   */
  fileActionsOpen: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isSelected: undefined,

  /**
   * @virtual
   * Set to true if this file is cut in clipboard
   * @type {boolean}
   */
  fileCut: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  touchTap: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  touchHold: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  fastClick: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  fastDoubleClick: notImplementedWarn,

  /**
   * Time in ms when the touch should be treated as a hold
   * @type {number}
   */
  holdTime: 500,

  /**
   * ID of timer invoked when started touch
   * @type {number}
   */
  touchTimer: null,

  /**
   * True when started touch but not yet ended
   * @type {boolean}
   */
  beingTouched: false,

  /**
   * True when the start touch timer invoked hold function, but the touch ended
   * before time so there should be tap handling rather than hold
   * @type {boolean}
   */
  tapIncoming: undefined,

  isInvalidated: not('file.type'),

  fileNameBase: reads('file.index'),

  fileNameSuffix: computed('file.{name,index}', function fileNameSuffix() {
    const file = this.get('file');
    const {
      name,
      index,
    } = getProperties(file, 'name', 'index');
    if (name === index) {
      return null;
    } else {
      return name.split(index)[1];
    }
  }),

  enableContextMenuToggle: computed(
    'fileActionsOpen',
    'type',
    function enableContextMenuToggle() {
      const {
        fileActionsOpen,
        type,
      } = this.getProperties('fileActionsOpen', 'type');
      return !fileActionsOpen && type !== 'broken';
    }
  ),

  fileEntityId: reads('file.entityId'),

  typeClass: computed('type', function typeClass() {
    return `fb-table-row-${this.get('type')}`;
  }),

  type: computed('file.type', function type() {
    const fileType = this.get('file.type');
    if (fileType === 'dir' || fileType === 'file' || fileType === 'broken') {
      return fileType;
    }
  }),

  icon: computed('type', function icon() {
    const type = this.get('type');
    switch (type) {
      case 'dir':
        return 'browser-directory';
      case 'file':
        return 'browser-file';
      case 'broken':
        return 'x';
      default:
        break;
    }
  }),

  contextmenuHandler: computed(function contextmenuHandler() {
    const component = this;
    const openContextMenu = component.get('openContextMenu');
    return function oncontextmenu(contextmenuEvent) {
      if (!get(component, 'beingTouched')) {
        openContextMenu(contextmenuEvent);
      }
      contextmenuEvent.preventDefault();
      contextmenuEvent.stopImmediatePropagation();
    };
  }),

  touchstartHandler: computed(function touchstartHandler() {
    const component = this;
    const touchTimerHandler = function touchTimerHandler() {
      safeExec(component, 'setProperties', {
        touchTimer: null,
        tapIncoming: false,
      });
      get(component, 'touchHold')();
    };
    /**
     * @param {TouchEvent} touchstartEvent
     * @returns {undefined}
     */
    return function ontouchstart(touchstartEvent) {
      if (isEventFromMenuToggle(touchstartEvent)) {
        return false;
      } else {
        const touchTimer = later(touchTimerHandler, get(component, 'holdTime'));
        safeExec(component, 'setProperties', {
          beingTouched: true,
          tapIncoming: true,
          touchTimer,
        });
      }
    };
  }),

  touchendHandler: computed(function touchendHandler() {
    const component = this;
    return function ontouchend(touchendEvent) {
      if (isEventFromMenuToggle(touchendEvent)) {
        return false;
      } else {
        const {
          tapIncoming,
          touchTimer,
        } = getProperties(component, 'tapIncoming', 'touchTimer');
        if (touchTimer != null) {
          cancel(touchTimer);
        }
        if (tapIncoming) {
          get(component, 'touchTap')();
        }
        safeExec(component, 'set', 'beingTouched', false);
        touchendEvent.preventDefault();
      }
    };
  }),

  touchmoveHandler: computed(function touchmoveHandler() {
    const component = this;
    return function ontouchmove( /* touchmoveEvent */ ) {
      if (get(component, 'beingTouched')) {
        cancel(get(component, 'touchTimer'));
        safeExec(component, 'setProperties', {
          tapIncoming: false,
          touchTimer: null,
        });
      }
    };
  }),

  hideMenuTrigger: computed(
    'selectionContext',
    'isSelected',
    'previewMode',
    function hideMenuTrigger() {
      const {
        isSelected,
        selectionContext,
        previewMode,
      } = this.getProperties('isSelected', 'selectionContext', 'previewMode');
      return previewMode || isSelected && selectionContext.startsWith('multi');
    }
  ),

  fileLoadError: computed('file.error', function fileLoadError() {
    const fileError = this.get('file.error');
    if (fileError) {
      return this.get('errorExtractor').getMessage(fileError);
    }
  }),

  isShared: reads('file.isShared'),

  hasMetadata: reads('file.hasMetadata'),

  hasEffQos: reads('file.hasEffQos'),

  hasDirectQos: reads('file.hasDirectQos'),

  didInsertElement() {
    this._super(...arguments);
    const {
      contextmenuHandler,
      touchendHandler,
      touchstartHandler,
      touchmoveHandler,
      element,
    } = this.getProperties(
      'contextmenuHandler',
      'touchendHandler',
      'touchstartHandler',
      'touchmoveHandler',
      'element',
    );
    element.addEventListener('contextmenu', contextmenuHandler);
    element.addEventListener('touchend', touchendHandler);
    element.addEventListener('touchstart', touchstartHandler, { passive: true });
    element.addEventListener('touchmove', touchmoveHandler, { passive: true });
  },

  willDestroyElement() {
    this._super(...arguments);
    const {
      contextmenuHandler,
      touchendHandler,
      touchstartHandler,
      touchmoveHandler,
      element,
    } = this.getProperties(
      'contextmenuHandler',
      'touchendHandler',
      'touchstartHandler',
      'touchmoveHandler',
      'element',
    );
    element.removeEventListener('contextmenu', contextmenuHandler);
    element.removeEventListener('touchstart', touchstartHandler);
    element.removeEventListener('touchend', touchendHandler);
    element.removeEventListener('touchmove', touchmoveHandler);
  },

  click(clickEvent) {
    this._super(...arguments);
    this.get('fastClick')(clickEvent);
  },

  actions: {
    openContextMenu() {
      this.openContextMenu(...arguments);
    },
    invokeFileAction(file, btnName) {
      this.get('invokeFileAction')(file, btnName);
    },
  },
});
