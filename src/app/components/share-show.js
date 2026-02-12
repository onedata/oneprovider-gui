/**
 * Container for share file browser to use in an iframe with injected properties.
 * Can be in two modes: private and public (when `publicMode` is set to true).
 * In private mode, styles are designed for standard unified GUI.
 * In public mode, styles are designed to fit unified GUI's public view without any
 * menus and sidebars.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { MetadataType } from 'oneprovider-gui/models/handle';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import I18n from 'onedata-gui-common/mixins/i18n';
import { promise } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import ShareRootErrorInfo, { ShareFileErrorType } from 'oneprovider-gui/utils/share-root-error-info';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

/**
 * @typedef {'publicdata'|'description'|'files'} ShareShowTabId
 */

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['share-show', 'content-file-browser', 'fill-flex-using-column'],
  classNameBindings: ['scopeClass'],

  shareManager: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual optional
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual optional
   * @type {String}
   */
  dirId: undefined,

  /**
   * @virtual optional
   * @type {ShareShowTabId}
   */
  initialTabId: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  publicMode: false,

  /**
   * @virtual
   * @type {Function}
   */
  updateDirId: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  onShowShareList: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  reloadShareList: notImplementedReject,

  /**
   * Frame name, where Onezone share link should be opened
   * @type {String}
   */
  navigateDirTarget: '_top',

  /**
   * @type {ShareShowTabId}
   */
  activeTab: undefined,

  tabIcons: Object.freeze({
    publicdata: 'globe-cursor',
    files: 'browser-directory',
    description: 'browser-rename',
  }),

  /**
   * @type {ComputedProperty<Utils.ShareRootErrorInfo>}
   */
  shareRootErrorInfo: computed(
    'share.{rootFileType,rootFile,privateRootFile}',
    function shareRootErrorInfo() {
      if (!this.share) {
        return;
      }
      return ShareRootErrorInfo.create({
        ownerSource: this,
        rootFileType: this.share.rootFileType,
        rootFilePrivateProxy: this.share.privateRootFile,
        rootFilePublicProxy: this.share.rootFile,
      });
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  description: reads('share.description'),

  /**
   * @type {ComputedProperty<String>}
   */
  spaceId: reads('share.spaceId'),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  requiredDataProxy: promise.object(promise.all('tabIdsProxy', 'handleStateProxy')),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  tabIdsProxy: promise.object(computed(
    'publicMode',
    'description',
    'handleState',
    function tabIdsProxy() {
      return this.get('handleStateProxy').then(handleState => {
        const {
          publicMode,
          description,
        } = this.getProperties('publicMode', 'description');
        const ids = [];
        if (handleState === 'available') {
          ids.push('publicdata');
        }
        if (!publicMode || description) {
          ids.push('description');
        }
        ids.push('files');
        if (!publicMode && handleState === 'noHandle') {
          ids.push('publicdata');
        }
        return ids;
      });
    }
  )),

  /**
   * @type {ComputedProperty<Array<String>|null>}
   */
  tabIds: reads('tabIdsProxy.content'),

  rootFileErrorType: reads('shareRootErrorInfo.rootFileErrorType'),

  shareRootDeletedProxy: computed(
    'shareRootErrorInfo.publicFileProxy',
    'rootFileErrorType',
    function shareRootDeletedProxy() {
      const promise = (async () => {
        await this.shareRootErrorInfo.publicFileProxy;
        return this.rootFileErrorType === ShareFileErrorType.NotFound;
      })();
      return promiseObject(promise);
    }
  ),

  rootFilePathErrorTip: computed(
    'rootFilePathText',
    'shareRootErrorInfo.errorDetails',
    function rootFilePathErrorTip() {
      if (!this.rootFilePathText) {
        return;
      }
      return this.shareRootErrorInfo.errorDetails;
    }
  ),

  /**
   * @type {ComputedProperty<Array<string>>}
   */
  disabledTabs: computed('isShareRootDeleted', function disabledTabs() {
    if (this.isShareRootDeleted) {
      return ['publicdata'];
    } else {
      return [];
    }
  }),

  tabClasses: computed(
    'rootFileErrorType',
    'handleStateProxy.content',
    function tabClasses() {
      if (
        this.handleStateProxy.content === 'noHandle' &&
        this.rootFileErrorType !== ShareFileErrorType.NotFound
      ) {
        return { publicdata: 'tab-label-notice' };
      } else {
        return {};
      }
    }
  ),

  rootFilePrivateProxy: computedRelationProxy('share.privateRootFile'),

  rootFilePublicProxy: computedRelationProxy('share.rootFile'),

  scopeClass: computed('publicMode', function scopeClass() {
    const publicMode = this.get('publicMode');
    return `share-show-${publicMode ? 'public' : 'private'}`;
  }),

  /**
   * @type {ComputedProperty<PromiseObject<String>>} resolved values:
   *   noHandle, available, forbidden, error
   */
  handleStateProxy: promise.object(computed('share.handle', function handleStateProxy() {
    const share = this.get('share');
    if (get(share, 'hasHandle')) {
      return share.getRelation('handle')
        // null handle relation means that it is not available for current user
        .then(handle => handle ? 'available' : 'forbidden')
        .catch(error => get(error || {}, 'id') === 'forbidden' ? 'forbidden' : 'error');
    } else {
      return resolve('noHandle');
    }
  })),

  handleState: reads('handleStateProxy.content'),

  navTabsShareModeClassname: computed(
    'tabIds',
    function navTabsShareModeClassname() {
      const classes = ['nav-tabs-share-mode'];
      for (const tabId of this.tabIds) {
        classes.push(`with-tab-${tabId}`);
      }
      return classes.join(' ');
    }
  ),

  areEuLogosShown: computed('share.handle.content', function areEuLogosShown() {
    const handle = this.get('share.handle.content');
    if (!handle) {
      return false;
    }
    return get(handle, 'metadataSchema') === MetadataType.Edm;
  }),

  init() {
    this._super(...arguments);
    (async () => {
      if (this.initialTabId) {
        const tabIds = await this.tabIdsProxy;
        if (tabIds.includes(this.initialTabId)) {
          this.setActiveTab(this.initialTabId);
        }
      }
      if (!this.activeTab) {
        if (this.dirId) {
          this.setActiveTab('files');
        } else {
          const handleState = await this.handleStateProxy;
          if (handleState === 'available') {
            this.setActiveTab('publicdata');
          } else if (this.get('share.description')) {
            this.setActiveTab('description');
          } else {
            this.setActiveTab('files');
          }
        }
      }
    })();
  },

  /**
   * @param {ShareShowTabId} tabId
   * @returns {void}
   */
  setActiveTab(tabId) {
    this.set('activeTab', tabId);
    this.appProxy.callParent('updateTabId', tabId);
    if (this.element) {
      scrollTopClosest(this.element);
    }
  },

  actions: {
    getDataUrl() {
      return this.getDataUrl(...arguments);
    },
    async onShowShareList() {
      await this.reloadShareList();
      this.onShowShareList();
    },
    updateDirId() {
      return this.updateDirId(...arguments);
    },
    containerScrollTop() {
      return this.containerScrollTop(...arguments);
    },
    reloadShareList() {
      this.reloadShareList();
    },
    /**
     * @param {ShareShowTabId} tabId
     * @returns {void}
     */
    changeActiveTab(tabId) {
      this.setActiveTab(tabId);
    },
  },
});
