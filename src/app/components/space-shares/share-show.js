/**
 * Container for share file browser to use in an iframe with injected properties.
 *
 * @module component/content-share-show
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, raw, or } from 'ember-awesome-macros';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

export default Component.extend(I18n, createDataProxyMixin('shareRootDeleted'), {
  classNames: ['share-show', 'content-file-browser'],
  classNameBindings: ['scopeClass'],

  shareManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.shareShow',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual optional
   * @type {String}
   */
  dirId: undefined,

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
  showShareList: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  reloadShareList: notImplementedReject,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * Frame name, where Onezone share link should be opened
   * @type {String}
   */
  navigateDirTarget: '_top',

  _window: window,

  hasHandle: reads('share.hasHandle'),

  description: reads('share.description'),

  tabIds: computed('publicMode', 'hasHandle', 'description', function tabIds() {
    const {
      publicMode,
      hasHandle,
      description,
    } = this.getProperties('publicMode', 'hasHandle', 'description');
    const ids = [];
    if (hasHandle) {
      ids.push('opendata');
    }
    if (!publicMode || description) {
      ids.push('description');
    }
    ids.push('files');
    if (!publicMode && !hasHandle) {
      ids.push('opendata');
    }
    return ids;
  }),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  disabledTabs: conditional('shareRootDeleted', raw(['opendata']), raw([])),

  // tabIds: conditional('publicMode',
  //   conditional('hasHandle', ''),
  //   conditional(
  //     'hasHandle',
  //     raw(['opendata', 'description', 'files']),
  //     raw(['description', 'files', 'opendata']),
  //   )
  // ),

  tabIcons: Object.freeze({
    opendata: 'globe-cursor',
    files: 'browser-directory',
    description: 'browser-rename',
  }),

  tabClasses: conditional(
    or('hasHandle', 'shareRootDeleted'),
    raw({}),
    raw({ opendata: 'tab-label-notice' })
  ),

  activeTab: undefined,

  /**
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @type {boolean}
   */
  publicMode: false,

  scopeClass: computed('publicMode', function scopeClass() {
    const publicMode = this.get('publicMode');
    return `share-show-${publicMode ? 'public' : 'private'}`;
  }),

  shareObserver: observer('share', function shareObserver() {
    this.updateShareRootDeletedProxy();
  }),

  init() {
    this._super(...arguments);
    if (this.get('hasHandle')) {
      this.set('activeTab', 'opendata');
    } else if (this.get('share.description')) {
      this.set('activeTab', 'description');
    } else {
      this.set('activeTab', 'files');
    }
  },

  /**
   * @override
   */
  fetchShareRootDeleted() {
    return this.get('share').getRelation('rootFile').then(() => false).catch(error =>
      get(error || {}, 'details.errno') === 'enoent'
    );
  },

  actions: {
    getDataUrl() {
      return this.get('getDataUrl')(...arguments);
    },
    showShareList() {
      return this.get('reloadShareList')()
        .then(() => this.get('showShareList')());
    },
    updateDirId() {
      return this.get('updateDirId')(...arguments);
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
  },
});
