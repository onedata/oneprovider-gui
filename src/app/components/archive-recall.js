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

  /**
   * @virtual
   * @type {() => void}
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   * @type {(result: RecallArchiveResponse) => (any|Promise<any>)}
   */
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

  ignoreDeselectSelector: '.archive-recall-modal-footer, .archive-recall-modal-footer *',

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

  targetFileExistsProxy: promise.object(computed(
    'targetName',
    'targetRecallParent',
    async function targetFileExistsProxy() {
      const {
        fileManager,
        targetName,
        targetRecallParent,
      } = this.getProperties(
        'fileManager',
        'targetName',
        'targetRecallParent',
      );
      if (targetName && targetRecallParent) {
        const parentId = get(targetRecallParent, 'entityId');
        return await fileManager.checkFileNameExists(parentId, targetName);
      }
    }
  )),

  validationErrorProxy: promise.object(computed(
    'targetName',
    'targetFileExistsProxy',
    async function validationErrorProxy() {
      const targetName = this.get('targetName');
      if (!targetName) {
        return this.t('targetNameValidation.empty');
      } else {
        const targetFileExists = await this.get('targetFileExistsProxy');
        if (targetFileExists) {
          return this.t('targetNameValidation.exists');
        } else {
          return null;
        }
      }
    }
  )),

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
  },

  /**
   * @returns {Promise<RecallArchiveResponse>}
   */
  async recallArchive() {
    const {
      globalNotify,
      archiveManager,
      archive,
      targetRecallParent,
      targetName,
      validationErrorProxy,
    } = this.getProperties(
      'globalNotify',
      'archiveManager',
      'archive',
      'targetRecallParent',
      'targetName',
      'validationErrorProxy',
    );
    if (await validationErrorProxy) {
      return;
    }

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
