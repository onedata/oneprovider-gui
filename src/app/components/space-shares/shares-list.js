/**
 * List of shares for single space
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { inject as service } from '@ember/service';
import InfiniteScroll from 'onedata-gui-common/utils/infinite-scroll';
import globals from 'onedata-gui-common/utils/globals';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import ConflictIdsArray from 'onedata-gui-common/utils/conflict-ids-array';

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
   * @type {ReplacingChunksArray<OneproviderShareListItem>}
   */
  shares: undefined,

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

  // FIXME: używać? może jak wracamy z widoku pojedynczego shera
  initialJumpIndex: null,

  //#endregion

  oneproviderName: reads('appProxy.injectedData.oneproviderName'),

  /**
   * @type {ComputedProperty<string>}
   */
  spaceId: reads('space.entityId'),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed(
    'shares.sourceArray.[]',
    function fileRequirements() {
      const shares = this.shares?.sourceArray.toArray();
      if (!shares) {
        return [];
      }
      const requirements = shares.map(share =>
        new FileRequirement({
          fileGri: share.rootFilePublicGri,
          // This requirement is used by internally used list-item component to pre-load
          // files data with needed properties, avoiding files reload when these components
          // are being inserted.
          properties: ['posixPermissions'],
        })
      );
      return requirements;
    }
  ),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computed(
    'shares.sourceArray.[]',
    function usedFileGris() {
      /** @type {Array<OneproviderShareListItem>} */
      const loadedShareItems = this.shares?.sourceArray.toArray();
      if (!loadedShareItems) {
        return [];
      }
      const gris = loadedShareItems.map(share => share.rootFilePublicGri);
      return gris;
    }
  ),

  dataTabUrl: computed('spaceId', function dataTabUrl() {
    return this.onGetDataUrl({ spaceId: this.spaceId });
  }),

  // FIXME: type
  infiniteScroll: computed('shares', function infiniteScroll() {
    return InfiniteScroll.create({
      entries: this.shares,
      singleRowHeight: this.rowHeight,
      // FIXME: implement, może auto refresh
      // onScroll: this.handleTableScroll.bind(this),
    });
  }),

  // FIXME: type
  conflictableShares: computed('shares', function conflictableShares() {
    return ConflictIdsArray.create({
      content: this.shares,
      diffProperty: 'id',
      conflictProperty: 'name',
    });
  }),

  init() {
    this._super(...arguments);

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
