import Component from '@ember/component';
import { computed } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend({
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

  dataTabUrl: computed('spaceId', function dataTabUrl() {
    const {
      getDataUrl,
      spaceId,
    } = this.getProperties('getDataUrl', 'spaceId');
    return getDataUrl({ spaceId });
  }),

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
