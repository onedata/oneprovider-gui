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

  // TODO: VFS-12506 It can be used for implementing scrolling to item after back
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
      const gris = this.getRootFilePublicGris();
      const requirements = gris.map(fileGri =>
        new FileRequirement({
          fileGri,
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
      return this.getRootFilePublicGris();
    }
  ),

  /**
   * NOTE: For some unknown Ember reason, when using computed properties to cache this
   * value for usage in `fileRequirements` and `usedFileGris` it does not recompute
   * properly, so falling back to computing GRIs always in these computed propeties.
   * @returns {Array<string>}
   */
  getRootFilePublicGris() {
    const gris = this.shares?.sourceArray.toArray().map(item =>
      item.rootFilePublicGri
    ).filter(gri => gri);
    return gris ?? [];
  },

  dataTabUrl: computed('spaceId', function dataTabUrl() {
    return this.onGetDataUrl({ spaceId: this.spaceId });
  }),

  /**
   * @type {ComputedProperty<Utils.InfiniteScroll>}
   */
  infiniteScroll: computed('shares', function infiniteScroll() {
    return InfiniteScroll.create({
      entries: this.shares,
      singleRowHeight: this.rowHeight,
    });
  }),

  /**
   * @type {ComputedProperties<ConflictIdsArray<OneproviderShareListItem>>}
   */
  conflictableShares: computed('shares', function conflictableShares() {
    return ConflictIdsArray.create({
      content: this.shares,
      diffProperty: 'id',
      conflictProperty: 'name',
    });
  }),

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
    // TODO: VFS-12506 resize observer - reload
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
