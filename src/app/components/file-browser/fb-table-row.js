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
import { equal, raw, or, array, and } from 'ember-awesome-macros';
import { get, computed, getProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import { later, cancel, scheduleOnce } from '@ember/runloop';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import FastDoubleClick from 'onedata-gui-common/mixins/components/fast-double-click';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { EntityPermissions } from 'oneprovider-gui/utils/posix-permissions';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

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
    'isLoadingDownload:is-loading-download',
  ],
  attributeBindings: ['fileEntityId:data-row-id'],

  errorExtractor: service(),
  media: service(),
  visualLogger: service(),
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
   * @type {(Models.File) => Promise}
   */
  fileDoubleClicked: notImplementedReject,

  /**
   * @virtual
   * @type {Boolean}
   */
  previewMode: undefined,

  /**
   * @virtual
   * Should be set to true, if other file on list have the same name
   * @type {Boolean}
   */
  nameConflict: false,

  /**
   * @virtual
   * @type {Boolean}
   */
  qosViewForbidden: false,

  inheritedIcon: 'arrow-long-up',

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

  fileNameParser: computed('file', function fileNameParser() {
    return FileNameParser.create({ file: this.get('file') });
  }),

  fileNameBase: reads('fileNameParser.base'),

  fileNameSuffix: reads('fileNameParser.suffix'),

  hintQosViewForbidden: computed(function hintQosForbidden() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_view_qos',
    });
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

  typeText: computed('type', function typeText() {
    const type = this.get('type');
    if (type) {
      return this.t('fileType.' + type);
    }
  }),

  type: computed('file.type', function type() {
    const fileType = this.get('file.type');
    if (fileType === 'dir' || fileType === 'file') {
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

  isForbidden: computed(
    'previewMode',
    'isSpaceOwned',
    'file.{type,owner.entityId,posixPermissions}',
    function isForbidden() {
      const {
        file,
        previewMode,
        isSpaceOwned,
      } = this.getProperties('file', 'previewMode', 'isSpaceOwned');
      if (isSpaceOwned) {
        return false;
      }
      const posixPermissions = get(file, 'posixPermissions');
      if (!posixPermissions) {
        return undefined;
      }
      let octalNumber;
      if (previewMode) {
        octalNumber = 2;
      } else {
        const fileOwnerGri = file.belongsTo('owner').id();
        const fileOwnerId = fileOwnerGri ? parseGri(fileOwnerGri).entityId : null;
        if (fileOwnerId === this.get('currentUser.userId')) {
          octalNumber = 0;
        } else {
          octalNumber = 1;
        }
      }
      const entityPermissions = EntityPermissions.create()
        .fromOctalRepresentation(get(file, 'posixPermissions')[octalNumber]);
      if (get(file, 'type') === 'file') {
        return !get(entityPermissions, 'read');
      } else {
        return !get(entityPermissions, 'read') || !get(entityPermissions, 'execute');
      }
    }
  ),

  /**
   * @override
   * `_fastDoubleClick` method is get as a function in `FastDoubleClick` mixin, so it
   * should be bound to this.
   */
  fastDoubleClick: computed(function fastDoubleClick() {
    return this._fastDoubleClick.bind(this);
  }),

  isShared: reads('file.isShared'),

  hasMetadata: reads('file.hasMetadata'),

  hasEffQos: reads('file.hasEffQos'),

  hasDirectQos: reads('file.hasDirectQos'),

  hasAcl: equal('file.activePermissionsType', raw('acl')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  hasDirectDataset: reads('file.hasDirectDataset'),

  hasEffDataset: reads('file.hasEffDataset'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isMetadataProtected: and('hasEffDataset', array.includes(
    'file.effProtectionFlags',
    raw('metadata_protection')
  )),

  // TODO: VFS-7403 this flag should be false if isDataset if false
  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDataProtected: and('hasEffDataset', array.includes(
    'file.effProtectionFlags',
    raw('data_protection')
  )),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  hasAnyProtectionFlag: or('isMetadataProtected', 'isDataProtected'),

  /**
   * Content for protection tag tooltip
   * @type {ComputedProperty<SafeString>}
   */
  protectionFlagsInfo: computed(
    'typeText',
    'isMetadataProtected',
    'isDataProtected',
    function protectionFlagsInfo() {
      const {
        typeText,
        isMetadataProtected,
        isDataProtected,
      } = this.getProperties('typeText', 'isMetadataProtected', 'isDataProtected');
      let translationKey;
      if (isDataProtected && isMetadataProtected) {
        translationKey = 'both';
      } else if (isDataProtected) {
        translationKey = 'data';
      } else if (isMetadataProtected) {
        translationKey = 'metadata';
      }
      if (translationKey) {
        return this.t(`protectionFlagsInfo.${translationKey}`, { fileType: typeText });
      } else {
        return '';
      }
    }
  ),

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

  _fastDoubleClick() {
    const fileDoubleClicked = this.get('fileDoubleClicked');
    if (fileDoubleClicked && typeof fileDoubleClicked === 'function') {
      const promise = fileDoubleClicked();
      if (promise && promise.finally) {
        this.set('isLoadingDownload', true);
        scheduleOnce('afterRender', () => {
          const spinner =
            this.element.querySelector('.file-info-container .download-loading-spinner');
          spinner.classList.add('start-transition');
        });
        promise.finally(() => {
          safeExec(this, 'set', 'isLoadingDownload', false);
        });
      }
    }
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
