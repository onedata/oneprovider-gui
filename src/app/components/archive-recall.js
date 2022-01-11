import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { promise, tag, or } from 'ember-awesome-macros';
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

  //#region state

  dirId: null,

  targetName: '',

  //#endregion

  /**
   * @implements ItemBrowserContainerBase
   */
  selectedItems: null,

  parentModalDialogSelector: tag `#${'modalId'} > .modal-dialog`,

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  datasetProxy: reads('archive.dataset'),

  /**
   * A dataset of archive.
   * @virtual optional
   * @type {Models.Dataset}
   */
  dataset: reads('datasetProxy.content'),

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

  /**
   * Parent for target root file or directory.
   * @type {Models.File}
   */
  targetRecallParent: or('selectedItems.firstObject', 'currentBrowsableItem'),

  init() {
    this._super(...arguments);
    // try to set default targetName
    this.get('datasetProxy').then(dataset => {
      if (!this.get('targetName')) {
        this.set('targetName', get(dataset, 'name'));
      }
    });
  },

  targetNameChanged(targetName) {
    this.set('targetName', targetName);
    // FIXME: invoke validation?
  },

  /**
   * @returns {Promise<RecallArchiveResponse>}
   */
  async recallArchive() {
    // FIXME: do not allow if invalid
    const {
      globalNotify,
      archiveManager,
      archive,
      targetRecallParent,
      targetName,
    } = this.getProperties(
      'globalNotify',
      'archiveManager',
      'archive',
      'targetRecallParent',
      'targetName'
    );
    let result;
    try {
      result = await archiveManager.recallArchive(
        archive,
        targetRecallParent,
        targetName
      );
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
