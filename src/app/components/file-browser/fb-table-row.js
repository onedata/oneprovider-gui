/**
 * Single file/directory row in files list.
 * 
 * @module components/file-browser/fb-table-row
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { get, computed, getProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import { later, cancel } from '@ember/runloop';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import FastDoubleClick from 'onedata-gui-common/mixins/components/fast-double-click';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, FastDoubleClick, {
  tagName: 'tr',
  classNames: ['fb-table-row', 'menu-toggle-hover-parent'],
  classNameBindings: ['typeClass', 'isSelected:file-selected', 'fileCut:file-cut'],
  attributeBindings: ['fileEntityId:data-row-id'],

  fileActions: service(),
  errorExtractor: service(),
  media: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTableRow',

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
  touching: false,

  /**
   * True when the start touch timer invoked hold function, but the touch ended
   * before time so there should be tap handling rather than hold
   * @type {boolean}
   */
  tapIncoming: undefined,

  displayName: computed('file.{name,type}', function displayName() {
    const file = this.get('file');
    if (get(file, 'type') === 'broken') {
      return this.t('brokenName');
    } else {
      return this.get('file.name');
    }
  }),

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
      if (!get(component, 'touching')) {
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
      if (touchstartEvent.target.matches('.one-menu-toggle *')) {
        return false;
      } else {
        const touchTimer = later(touchTimerHandler, get(component, 'holdTime'));
        safeExec(component, 'setProperties', {
          touching: true,
          tapIncoming: true,
          touchTimer,
        });
      }
    };
  }),

  touchendHandler: computed(function touchendHandler() {
    const component = this;
    return function ontouchend(touchendEvent) {
      if (touchendEvent.target.matches('.one-menu-toggle *')) {
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
        safeExec(component, 'set', 'touching', false);
        touchendEvent.preventDefault();
      }
    };
  }),

  touchmoveHandler: computed(function touchmoveHandler() {
    const component = this;
    return function ontouchmove( /* touchmoveEvent */ ) {
      if (get(component, 'touching')) {
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
    function hideMenuTrigger() {
      const {
        isSelected,
        selectionContext,
      } = this.getProperties('isSelected', 'selectionContext');
      return isSelected && selectionContext.startsWith('multi');
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

  didInsertElement() {
    this._super(...arguments);
    const {
      contextmenuHandler,
      touchendHandler,
      touchstartHandler,
      touchmoveHandler,
    } = this.getProperties(
      'contextmenuHandler',
      'touchendHandler',
      'touchstartHandler',
      'touchmoveHandler',
    );
    this.element.addEventListener('contextmenu', contextmenuHandler);
    this.element.addEventListener('touchend', touchendHandler);
    this.element.addEventListener('touchstart', touchstartHandler, { passive: true });
    this.element.addEventListener('touchmove', touchmoveHandler, { passive: true });
  },

  willDestroyElement() {
    this._super(...arguments);
    const {
      contextmenuHandler,
      touchendHandler,
      touchstartHandler,
      touchmoveHandler,
    } = this.getProperties(
      'contextmenuHandler',
      'touchendHandler',
      'touchstartHandler',
      'touchmoveHandler',
    );
    this.element.removeEventListener('contextmenu', contextmenuHandler);
    this.element.removeEventListener('touchstart', touchstartHandler);
    this.element.removeEventListener('touchend', touchendHandler);
    this.element.removeEventListener('touchmove', touchmoveHandler);
  },

  click(clickEvent) {
    this._super(...arguments);
    this.get('fastClick')(clickEvent);
  },

  actions: {
    openContextMenu() {
      this.openContextMenu(...arguments);
    },
  },
});
