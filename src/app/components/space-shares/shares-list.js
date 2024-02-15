/**
 * List of shares for single space
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { all as allFulfilled } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { promise } from 'ember-awesome-macros';
import _ from 'lodash';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

const mixins = [
  FileConsumerMixin,
  createDataProxyMixin('sharesWithDeletedFiles'),
];

export default Component.extend(...mixins, {
  classNames: ['shares-list'],

  /**
   * @virtual
   * @type {Function}
   */
  getShareUrl: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  getDataUrl: undefined,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {PromiseArray<Models.Share>}
   */
  sharesProxy: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  startRemoveShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  startRenameShare: notImplementedThrow,

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('sharesProxy.content', function fileRequirements() {
    const shares = this.sharesProxy?.content ?? [];
    return shares.map(share =>
      new FileRequirement({
        fileGri: share.belongsTo('rootFile').id(),
        // This requirement is used by internally used list-item component to pre-load
        // files data with needed properties, avoiding files reload when these components
        // are being inserted.
        properties: ['posixPermissions'],
      })
    );
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computed('sharesProxy.content', function usedFileGris() {
    const shares = this.get('sharesProxy.content');
    if (!shares) {
      return [];
    }
    return shares.map(share => share.belongsTo('rootFile').id());
  }),

  dataTabUrl: computed('spaceId', function dataTabUrl() {
    const {
      getDataUrl,
      spaceId,
    } = this.getProperties('getDataUrl', 'spaceId');
    return getDataUrl({ spaceId });
  }),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  dataProxy: promise.object(promise.all(
    'sharesProxy',
    'sharesWithDeletedFilesProxy',
  )),

  /**
   * @override
   */
  async fetchSharesWithDeletedFiles() {
    return this.get('sharesProxy')
      .then(shares => allFulfilled(
        shares.map(share => share.getRelation('rootFile')
          .then(() => null)
          .catch(error => get(error || {}, 'details.errno') === 'enoent' ? share : null)
        )))
      .then(shares => _.compact(shares));
  },

  actions: {
    getShareUrl(...args) {
      return this.get('getShareUrl')(...args);
    },
    startRemoveShare(...args) {
      return this.get('startRemoveShare')(...args);
    },
    startRenameShare(...args) {
      return this.get('startRenameShare')(...args);
    },
  },
});
