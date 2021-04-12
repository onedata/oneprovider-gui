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
import { equal, raw, or, and, array, conditional, isEmpty } from 'ember-awesome-macros';
import { get, computed, getProperties, observer } from '@ember/object';
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
    'isLoadingOnIcon:is-loading-on-icon',
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

  /**
   * @virtual
   * @type {Boolean}
   */
  datasetsViewForbidden: false,

  /**
   * If true, a spinner will be displayed instead of item icon
   * @virtual
   * @type {Boolean}
   */
  isLoadingOnIcon: false,

  /**
   * Name of icon to indicate that some property in tag is inhertied from ancestor
   * @type {String}
   */
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

  /**
   * Text for QoS tag tooltip, when cannot open QoS modal
   * @type {ComputedProperty<SafeString>}
   */
  hintQosViewForbidden: computed(function hintQosForbidden() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_view_qos',
    });
  }),

  /**
   * Text for dataset tag tooltip, when cannot open datasets modal
   * @type {ComputedProperty<SafeString>}
   */
  hintDatasetsViewForbidden: computed(function hintDatasetsViewForbidden() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_view',
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
    return `fb-table-row-${this.get('type') || 'unknown'}`;
  }),

  typeText: computed('type', function typeText() {
    const type = this.get('type');
    if (type) {
      return this.t('fileType.' + type);
    }
  }),

  type: computed('file.type', function type() {
    return normalizeFileType(this.get('file.type'));
  }),

  effFileType: computed('file.effFile.type', function effFileType() {
    return normalizeFileType(this.get('file.effFile.type'));
  }),

  isSymlink: equal('type', raw('symlink')),

  icon: computed('effFileType', function icon() {
    switch (this.get('effFileType')) {
      case 'dir':
        return 'browser-directory';
      case 'file':
      default:
        return 'browser-file';
    }
  }),

  hasErrorIconTag: isEmpty('effFileType'),

  iconTag: conditional(
    'hasErrorIconTag',
    raw('x'),
    conditional(
      equal('type', raw('symlink')),
      raw('shortcut'),
      raw(null)
    )
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

  effQosMembership: reads('file.effQosMembership'),

  showQosTag: and(
    not('previewMode'),
    not('isSymlink'),
    array.includes(raw(['ancestor', 'direct']), 'effQosMembership')
  ),

  hasAcl: equal('file.activePermissionsType', raw('acl')),

  effDatasetMembership: reads('file.effDatasetMembership'),

  hardlinksCount: or('file.hardlinksCount', raw(1)),

  /**
   * If true, should display dataset tag
   * @type {ComputedProperty<Boolean>}
   */
  showDatasetTag: and(
    not('previewMode'),
    not('isSymlink'),
    array.includes(raw(['ancestor', 'direct']), 'effDatasetMembership')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtected: and(
    'showDatasetTag',
    'file.dataIsProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: and(
    'showDatasetTag',
    'file.metadataIsProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  hasAnyProtectionFlag: or('metadataIsProtected', 'dataIsProtected'),

  /**
   * Content for protection tag tooltip
   * @type {ComputedProperty<SafeString>}
   */
  protectionFlagsInfo: computed(
    'typeText',
    'metadataIsProtected',
    'dataIsProtected',
    function protectionFlagsInfo() {
      const {
        typeText,
        metadataIsProtected,
        dataIsProtected,
      } = this.getProperties('typeText', 'metadataIsProtected', 'dataIsProtected');
      let translationKey;
      if (dataIsProtected && metadataIsProtected) {
        translationKey = 'both';
      } else if (dataIsProtected) {
        translationKey = 'data';
      } else if (metadataIsProtected) {
        translationKey = 'metadata';
      }
      if (translationKey) {
        return this.t(`protectionFlagsInfo.${translationKey}`, { fileType: typeText });
      } else {
        return '';
      }
    }
  ),

  loadingOnIconTransitionObserver: observer(
    'isLoadingOnIcon',
    function loadingOnIconTransitionObserver() {
      if (this.get('isLoadingOnIcon')) {
        scheduleOnce('afterRender', () => {
          const spinner =
            this.element.querySelector('.file-info-container .on-icon-loading-spinner');
          if (spinner) {
            spinner.classList.add('start-transition');
          }
        });
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.loadingOnIconTransitionObserver();
  },

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

  async _fastDoubleClick() {
    const fileDoubleClicked = this.get('fileDoubleClicked');
    if (fileDoubleClicked && typeof fileDoubleClicked === 'function') {
      await fileDoubleClicked();
    }
  },

  actions: {
    openContextMenu() {
      this.openContextMenu(...arguments);
    },
    invokeFileAction(file, btnName, ...args) {
      this.get('invokeFileAction')(file, btnName, ...args);
    },
  },
});

function normalizeFileType(fileType) {
  if (['dir', 'file', 'symlink'].includes(fileType)) {
    return fileType;
  }
}
