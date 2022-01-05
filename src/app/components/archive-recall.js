import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { promise, tag } from 'ember-awesome-macros';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import { inject as service } from '@ember/service';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import { guidFor } from '@ember/object/internals';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
];

export default Component.extend(...mixins, {
  tagName: '',

  i18n: service(),
  fileManager: service(),
  archiveManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveRecall',

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

  onCancel: notImplementedIgnore,

  onArchiveRecallStarted: notImplementedIgnore,

  dirId: null,

  /**
   * @implements ItemBrowserContainerBase
   */
  selectedItems: null,

  parentModalDialogSelector: tag `#${'modalId'} > .modal-dialog`,

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  /**
   * A dataset of archive.
   * @virtual optional
   * @type {Models.Dataset}
   */
  dataset: reads('archive.dataset.content'),

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
    const {
      globalNotify,
      archiveManager,
      archive,
      currentBrowsableItem,
    } = this.getProperties(
      'globalNotify',
      'archiveManager',
      'archive',
      'currentBrowsableItem'
    );
    const targetDirId = currentBrowsableItem && get(currentBrowsableItem, 'entityId');
    if (!targetDirId) {
      throw new Error(
        'component:archive-recall#recallArchive: no currentBrowsableItem.entityId'
      );
    }
    let result;
    try {
      result = await archiveManager.recallArchive(archive, targetDirId);
    } catch (error) {
      globalNotify.backendError(this.t('archiveRecallProcessStart'), error);
      throw error;
    }
    globalNotify.success(this.t('archiveRecallStartSuccess'));
    return result;
  },

  actions: {
    async submit() {
      const result = await this.recallArchive();
      await this.onArchiveRecallStarted(result);
      return result;
    },
  },
});
