/**
 * List of shares for single space
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads, sort } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { promise } from 'ember-awesome-macros';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { inject as service } from '@ember/service';
import InfiniteScroll from 'onedata-gui-common/utils/infinite-scroll';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import globals from 'onedata-gui-common/utils/globals';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';

const mixins = [
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
  classNames: ['shares-list'],

  appProxy: service(),
  shareManager: service(),

  /**
   * @virtual
   * @type {Function}
   */
  onGetShareUrl: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  onGetDataUrl: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {PromiseArray<Models.Share>}
   */
  sharesProxy: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onStartRemoveShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  onStartRenameShare: notImplementedThrow,

  //#region configuration

  rowHeight: 65,

  //#endregion

  //#region state

  /**
   * @type {Utils.InfiniteScroll}
   */
  infiniteScroll: undefined,

  shares: undefined,

  // FIXME: używać? może jak wracamy z widoku pojedynczego shera
  initialJumpIndex: null,

  //#endregion

  oneproviderName: reads('appProxy.injectedData.oneproviderName'),

  /**
   * @type {ComputedProperty<string>}
   */
  spaceId: reads('space.entityId'),

  // FIXME: do implementacji
  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  // fileRequirements: computed('sharesProxy.content', function fileRequirements() {
  //   const shares = this.sharesProxy?.content ?? [];
  //   return shares.map(share =>
  //     new FileRequirement({
  //       fileGri: share.belongsTo('rootFile').id(),
  //       // This requirement is used by internally used list-item component to pre-load
  //       // files data with needed properties, avoiding files reload when these components
  //       // are being inserted.
  //       properties: ['posixPermissions'],
  //     })
  //   );
  // }),

  // FIXME: do implementacji
  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  // usedFileGris: computed('sharesProxy.content', function usedFileGris() {
  //   const shares = this.get('sharesProxy.content');
  //   if (!shares) {
  //     return [];
  //   }
  //   return shares.map(share => share.belongsTo('rootFile').id());
  // }),

  dataTabUrl: computed('spaceId', function dataTabUrl() {
    return this.onGetDataUrl({ spaceId: this.spaceId });
  }),

  init() {
    this._super(...arguments);
    const shares = ReplacingChunksArray.create({
      fetch: this.getShareList.bind(this),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
      initialJumpIndex: this.initialJumpIndex,
    });

    const infiniteScroll = InfiniteScroll.create({
      entries: shares,
      singleRowHeight: this.rowHeight,
      // FIXME: implement, może auto refresh
      // onScroll: this.handleTableScroll.bind(this),
    });

    this.setProperties({
      shares,
      infiniteScroll,
    });

    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_shares_list');
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);

    (async () => {
      await this.shares.initialLoad;
      await waitForRender();
      /** @type {HTMLElement} */
      const entriesTable = this.element.querySelector('.entries-table');
      this.infiniteScroll.mount(
        entriesTable,
        globals.document.querySelector('#content-scroll')
      );
    })();
    // FIXME: resize observer;
  },

  // FIXME: type
  async getShareList(index, limit, offset) {
    return await this.shareManager.getOnezoneSpaceShareList(this.spaceId, {
      index,
      limit,
      offset,
    });
  },

  dataProxy: reads('shares.initialLoad'),

  actions: {
    getShareUrl(...args) {
      return this.onGetShareUrl(...args);
    },
    startRemoveShare(...args) {
      return this.onStartRemoveShare(...args);
    },
    startRenameShare(...args) {
      return this.onStartRenameShare(...args);
    },
  },
});
