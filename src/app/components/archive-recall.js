import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { tag } from 'ember-awesome-macros';
import { computed, get } from '@ember/object';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';

const mixins = [
  ItemBrowserContainerBase,
];

export default Component.extend(...mixins, {
  fileManager: service(),

  /**
   * @implements ItemBrowserContainerBase
   * @type {Models.Space}
   */
  space: null,

  /**
   * @type {Models.Archive}
   */
  archive: null,

  /**
   * @virtual
   */
  modalId: null,

  dirId: null,

  /**
   * @implements ItemBrowserContainerBase
   */
  selectedItems: null,

  parentModalDialogSelector: tag `#${'modalId'} > .modal-dialog`,

  onCancel: notImplementedIgnore,

  onArchiveRecallStarted: notImplementedIgnore,

  /**
   * @implements ItemBrowserContainerBase
   */
  currentBrowsableItemProxy: promise.object(computed(
    'space.rootDir',
    'dirId',
    function currentBrowsableItemProxy() {
      const {
        fileManager,
        space,
        dirId,
      } = this.getProperties('fileManager', 'space', 'dirId');
      if (dirId) {
        return fileManager.getFileById(dirId);
      } else {
        return get(space, 'rootDir');
      }
    }
  )),

  browserRequiredDataProxy: promise.object(computed(function browserRequiredDataProxy() {
    return this.get('currentBrowsableItemProxy');
  })),

  currentBrowsableItem: computedLastProxyContent('currentBrowsableItemProxy'),

  async recallArchive() {

  },

  actions: {
    async submit() {
      const result = await this.recallArchive();
      await this.onArchiveRecallStarted(result);
      return result;
    },
  },
});
