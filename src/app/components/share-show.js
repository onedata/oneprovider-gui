/**
 * Container for share file browser to use in an iframe with injected properties.
 * Can be in two modes: private and public (when `publicMode` is set to true).
 * In private mode, styles are designed for standard unified GUI.
 * In public mode, styles are designed to fit unified GUI's public view without any
 * menus and sidebars.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, observer } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import I18n from 'onedata-gui-common/mixins/i18n';
import { conditional, raw, and, not, promise } from 'ember-awesome-macros';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve } from 'rsvp';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';

/**
 * @typedef {'opendata'|'description'|'files'} ShareShowTabId
 */

const mixins = [
  I18n,
  createDataProxyMixin('shareRootDeleted'),
];

export default Component.extend(...mixins, {
  classNames: ['share-show', 'content-file-browser', 'fill-flex-using-column'],
  classNameBindings: ['scopeClass'],

  shareManager: service(),

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
    opendata: 'globe-cursor',
    files: 'browser-directory',
    description: 'browser-rename',
  }),

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
          ids.push('opendata');
        }
        if (!publicMode || description) {
          ids.push('description');
        }
        ids.push('files');
        if (!publicMode && handleState === 'noHandle') {
          ids.push('opendata');
        }
        return ids;
      });
    }
  )),

  /**
   * @type {ComputedProperty<Array<String>|null>}
   */
  tabIds: reads('tabIdsProxy.content'),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  disabledTabs: conditional(
    and('shareRootDeleted', not(equal('handleStateProxy.content', 'available'))),
    raw(['opendata']),
    raw([])
  ),

  tabClasses: conditional(
    and(equal('handleStateProxy.content', 'noHandle'), not('shareRootDeleted')),
    raw({ opendata: 'tab-label-notice' }),
    raw({})
  ),

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

  shareObserver: observer('share', function shareObserver() {
    this.updateShareRootDeletedProxy();
  }),

  tabScrollObserver: observer('activeTab', function tabScrollObserver() {
    scrollTopClosest(this.get('element'));
  }),

  init() {
    this._super(...arguments);
    (async () => {
      if (this.initialTabId) {
        const tabIds = await this.tabIdsProxy;
        if (tabIds.includes(this.initialTabId)) {
          this.set('activeTab', this.initialTabId);
        }
      }
      if (!this.activeTab) {
        const handleState = await this.handleStateProxy;
        if (handleState === 'available') {
          this.set('activeTab', 'opendata');
        } else if (this.get('share.description')) {
          this.set('activeTab', 'description');
        } else {
          this.set('activeTab', 'files');
        }
      }
    })();
  },

  /**
   * @override
   */
  fetchShareRootDeleted() {
    return this.get('share').getRelation('rootFile')
      .then(() => false)
      .catch(error => get(error || {}, 'details.errno') === 'enoent');
  },

  actions: {
    getDataUrl() {
      return this.get('getDataUrl')(...arguments);
    },
    onShowShareList() {
      return this.get('reloadShareList')()
        .then(() => this.get('onShowShareList')());
    },
    updateDirId() {
      return this.get('updateDirId')(...arguments);
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
  },
});
