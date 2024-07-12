/**
 * Single row in file browser table items list.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads, not } from '@ember/object/computed';
import { raw, conditional, isEmpty, or, and } from 'ember-awesome-macros';
import { get, computed, getProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import { later, cancel } from '@ember/runloop';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import FastDoubleClick from 'onedata-gui-common/mixins/components/fast-double-click';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import layout from 'oneprovider-gui/templates/components/file-browser/fb-table-row';
import { htmlSafe } from '@ember/string';
import { asyncObserver } from 'onedata-gui-common/utils/observer';

function isEventFromMenuToggle(event) {
  return event.target.matches('.one-menu-toggle, .one-menu-toggle *');
}

const mixins = Object.freeze([
  I18n,
  FastDoubleClick,
]);

export default Component.extend(...mixins, {
  layout,
  tagName: 'tr',
  classNames: ['fb-table-row', 'menu-toggle-hover-parent'],
  classNameBindings: [
    'typeClass',
    'isSelected:file-selected',
    'fileCut:file-cut',
    'isInvalidated:is-invalidated',
    'isLoadingOnIcon:is-loading-on-icon',
    'isDisabled:item-disabled',
    'isMuted:item-muted',
  ],
  attributeBindings: ['fileEntityId:data-row-id'],

  errorExtractor: service(),
  isMobile: service(),
  media: service(),
  currentUser: service(),
  i18n: service(),

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
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  isSpaceOwned: undefined,

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
   * @type {Function}
   */
  invokeFileAction: notImplementedThrow,

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
   * Clipboard mode for this file. Should be null if clipboard have globally some mode,
   * but this file is not affected.
   * @virtual
   * @type {String}
   */
  fileClipboardMode: null,

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
   * @type {(Models.File) => Promise}
   */
  fileDoubleClicked: notImplementedReject,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  fileCut: false,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  isDisabled: false,

  /**
   * Should be set to true, if other file on list have the same name
   * @virtual
   * @type {Boolean}
   *
   */
  nameConflict: false,

  /**
   * If true, a spinner will be displayed instead of item icon
   * @virtual
   * @type {Boolean}
   */
  isLoadingOnIcon: false,

  /**
   * Text for type of object for this row, eg. "directory".
   * @virtual
   * @type {String}
   */
  typeText: undefined,

  /**
   * @virtual
   * @type {SpacePrivileges}
   */
  spacePrivileges: undefined,

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

  /**
   * If provided, show tooltip with this text on item icon.
   * @type {String|SafeString}
   */
  iconTip: '',

  statusBarModel: Object.freeze({}),

  /**
   * @type {boolean}
   */
  isFileNameHovered: false,

  previewMode: reads('browserModel.previewMode'),

  statusBarComponentName: or(
    'browserModel.statusBarComponentName',
    raw('file-browser/fb-table-row-status-bar')
  ),

  mobileSecondaryInfoComponentName: reads('browserModel.mobileSecondaryInfoComponentName'),

  secondaryInfoComponentName: reads('browserModel.secondaryInfoComponentName'),

  columnsComponentName: or(
    'browserModel.columnsComponentName',
    raw('file-browser/fb-table-row-columns')
  ),

  /**
   * @type {ComputedProperty<String|null>}
   */
  infoIconActionName: computed(
    'isMobile.any',
    'browserModel.infoIconActionName',
    function infoIconActionName() {
      const isDisabled = this.get('isDisabled');
      const isMobile = this.get('isMobile.any');
      const actionName = this.get('browserModel.infoIconActionName');
      if (isDisabled || isMobile) {
        return null;
      } else {
        return actionName;
      }
    }
  ),
  showSecondaryInfo: and(not('showMobileSecondaryInfo'), 'secondaryInfoComponentName'),

  showMobileSecondaryInfo: and('media.isMobile', 'mobileSecondaryInfoComponentName'),

  multilineInfo: or('showSecondaryInfo', 'showMobileSecondaryInfo'),

  isInvalidated: not('file.type'),

  /**
   * Applies a "muted" style for file row (looks like something inactive).
   * @type {ComputedProperty<Boolean>}
   */
  isMuted: or('isDisabled', 'fileCut'),

  fileNameBase: reads('file.name'),

  fileNameSuffix: '',

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
    return `fb-table-row-${this.get('type') || 'unknown'}`;
  }),

  type: computed('file.type', function type() {
    return this.normalizeFileType(this.get('file.type'));
  }),

  effFileType: computed('file.effFile.type', function effFileType() {
    return this.normalizeFileType(this.get('file.effFile.type'));
  }),

  /**
   * Name of icon to display for item
   * @virtual
   * @type {String}
   */
  icon: 'browser-file',

  /**
   * @type {SafeString}
   */
  cursorStyleForIcon: computed('infoIconActionName', function cursorStyleForIcon() {
    return this.get('infoIconActionName') ?
      htmlSafe('cursor: pointer;') : htmlSafe('cursor: default;');
  }),

  hasErrorIconTag: isEmpty('effFileType'),

  /**
   * @type {ComputedProperty<String>}
   */
  iconTaggedClass: conditional(
    'hasErrorIconTag',
    raw('danger'),
    raw(null),
  ),

  iconTag: conditional(
    'hasErrorIconTag',
    raw('x'),
    raw(null)
  ),

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
    'isDisabled',
    function hideMenuTrigger() {
      const {
        selectionContext,
        isSelected,
        isDisabled,
      } = this.getProperties(
        'selectionContext',
        'isSelected',
        'isDisabled',
      );
      return isSelected && selectionContext.startsWith('multi') || isDisabled;
    }
  ),

  fileLoadError: computed('file.error', function fileLoadError() {
    const fileError = this.get('file.error');
    if (fileError) {
      return this.get('errorExtractor').getMessage(fileError);
    }
  }),

  /**
   * @override
   * `_fastDoubleClick` method is get as a function in `FastDoubleClick` mixin, so it
   * should be bound to this.
   */
  fastDoubleClick: computed(function fastDoubleClick() {
    return this._fastDoubleClick.bind(this);
  }),

  loadingOnIconTransitionObserver: asyncObserver(
    'isLoadingOnIcon',
    function loadingOnIconTransitionObserver() {
      if (!this.isLoadingOnIcon || !this.element) {
        return;
      }
      const spinner =
        this.element.querySelector('.file-info-container .on-icon-loading-spinner');
      if (spinner) {
        spinner.classList.add('start-transition');
      }
    }
  ),

  didInsertElement() {
    this._super(...arguments);
    this.loadingOnIconTransitionObserver();
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

  async _fastDoubleClick() {
    const fileDoubleClicked = this.get('fileDoubleClicked');
    if (fileDoubleClicked && typeof fileDoubleClicked === 'function') {
      await fileDoubleClicked();
    }
  },

  /**
   * Given type from file object, should return valid file type supported by
   * this component.
   * @param {String} fileType
   * @returns {String}
   */
  normalizeFileType(fileType) {
    if (['dir', 'file'].includes(fileType)) {
      return fileType;
    }
  },

  actions: {
    openContextMenu() {
      this.openContextMenu(...arguments);
    },
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
    async handleInfoIconClick(event) {
      if (!this.infoIconActionName) {
        return;
      }
      this.invokeFileAction(this.file, this.infoIconActionName);
      event.stopPropagation();
    },
    changeFileNameHover(isFileNameHovered) {
      this.set('isFileNameHovered', isFileNameHovered);
    },
  },
});
