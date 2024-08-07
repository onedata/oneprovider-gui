/**
 * Configurator and launcher for recalling an archive to selected location.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { promise, tag, or, raw } from 'ember-awesome-macros';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import { guidFor } from '@ember/object/internals';
import I18n from 'onedata-gui-common/mixins/i18n';
import { defer } from 'rsvp';
import { debounce } from '@ember/runloop';
import FileConsumerMixin, { computedSingleUsedFileGri } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

const mixins = [
  I18n,
  FileConsumerMixin,
];

/**
 * @typedef {Object} ArchiveRecallComponentOptions
 * @property {Number} checkTargetDelay Time in milliseconds to debounce checking if target
 *   path exists.
 */

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
   * @virtual
   * @implements ItemBrowserContainerBase
   * @type {Models.Space}
   */
  space: null,

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: null,

  /**
   * @virtual
   * @type {String}
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

  /**
   * Additional non-required options.
   * @virtual optional
   * @type {ArchiveRecallComponentOptions}
   */
  options: Object.freeze({}),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('targetRecallParent.effFile', function fileRequirements() {
    const effRecallParent = this.get('targetRecallParent.effFile');
    if (!effRecallParent) {
      return [];
    }
    return [
      new FileRequirement({
        fileGri: get(effRecallParent, 'id'),
        properties: ['recallingInheritancePathProxy'],
      }),
    ];
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedSingleUsedFileGri('targetRecallParent.effFile'),

  //#region state

  /**
   * Entity ID of dir currently viewed in embedded file browser.
   * Null means root dir of space.
   * @type {String|null}
   */
  dirId: null,

  /**
   * Name of file/directory to be created for recalled data.
   * @type {String}
   */
  targetName: '',

  /**
   * Defer object stored to resolve information if path to create target already exists
   * (true) or not (false). Promise of defer is used to fulfil `targetFileExistsProxy`.
   * @type {RSVP.Deferred<Boolean>}
   */
  targetFileCheckDeferred: null,

  /**
   * Stores previous value of `targetRecallParent` to prevent unecessary observer
   * operations (selectedItems are updated on every click, so it could update on every
   * click).
   * @type {Model.File}
   */
  prevTargetRecallParent: null,

  //#endregion

  //#region constants

  parentModalDialogSelector: tag `#${'modalId'} > .modal-dialog`,

  ignoreDeselectSelector: '.archive-recall-modal-footer, .archive-recall-modal-footer *',

  //#endregion

  //#region computed properties

  /**
   * Time in milliseconds to debounce checking if target path exists.
   * @type {ComputedProperty<Number>}
   */
  checkTargetDelay: or('options.checkTargetDelay', raw(500)),

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  datasetProxy: reads('archive.dataset'),

  /**
   * A dataset of archive.
   * @type {ComputedProperty<Models.Dataset|null>}
   */
  dataset: reads('datasetProxy.content'),

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
    'targetFileCheckDeferred',
    async function targetFileExistsProxy() {
      const targetFileCheckDeferred = this.get('targetFileCheckDeferred');
      const exists = targetFileCheckDeferred ?
        await targetFileCheckDeferred.promise : false;
      return exists;
    }
  )),

  nameValidationErrorProxy: promise.object(computed(
    'targetName',
    'targetFileExistsProxy',
    async function nameValidationErrorProxy() {
      const targetName = this.get('targetName');
      if (!targetName) {
        return this.t('targetNameValidation.empty');
      }

      if (targetName === '.' || targetName === '..') {
        return this.t('targetNameValidation.dots', { targetName });
      }

      if (targetName.includes('/')) {
        return this.t('targetNameValidation.slash');
      }

      const targetFileExists = await this.get('targetFileExistsProxy');
      if (targetFileExists) {
        return this.t('targetNameValidation.exists');
      }

      return null;
    }
  )),

  browserValidationErrorProxy: promise.object(computed(
    'targetRecallParent.effFile.recallingInheritancePathProxy',
    async function browserValidationError() {
      const recallingInheritancePath =
        await this.get('targetRecallParent.effFile.recallingInheritancePathProxy');
      if (recallingInheritancePath && recallingInheritancePath !== 'none') {
        return this.t('browserValidation.recalling');
      }

      return null;
    }
  )),

  footerDisabled: or(
    'disabled',
    'browserValidationErrorProxy.isPending',
    'browserValidationError'
  ),

  //#endregion

  //#region observers

  /**
   * Invoke on changes that affects target file/directory, so a validation is needed
   * (with some debounce).
   */
  targetNameObserver: observer(
    'targetName',
    function targetNameObserver() {
      this.scheduleTargetCheck();
    }
  ),

  targetParentObserver: observer(
    'targetRecallParent',
    function targetParentObserver() {
      const {
        targetRecallParent,
        prevTargetRecallParent,
      } = this.getProperties('targetRecallParent', 'prevTargetRecallParent');
      if (targetRecallParent !== prevTargetRecallParent) {
        this.scheduleTargetCheck();
        this.set('prevTargetRecallParent', targetRecallParent);
      }
    }
  ),

  //#endregion

  init() {
    this._super(...arguments);
    this.scheduleTargetCheck(0);
    // try to set default targetName
    this.get('datasetProxy').then(dataset => {
      if (!this.get('targetName')) {
        this.set('targetName', get(dataset, 'name'));
      }
    });
  },

  scheduleTargetCheck(delay = this.get('checkTargetDelay')) {
    this.set('targetFileCheckDeferred', defer());
    debounce(this, 'updateTargetCheckDeferred', delay);
  },

  async checkTargetFileExists() {
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
    } else {
      return false;
    }
  },

  async updateTargetCheckDeferred() {
    // current deferred can change when checking is in progress, so we need to use
    // a current deferred from time moment when update was invoked
    const targetFileCheckDeferred = this.get('targetFileCheckDeferred');
    const targetFileExists = await this.checkTargetFileExists();
    targetFileCheckDeferred.resolve(targetFileExists);
    return targetFileExists;
  },

  targetNameChanged(targetName) {
    this.set('targetName', targetName);
  },

  /**
   * Besides storing selectedItems in the browserModel, we need to store selected items
   * that are selected as target to recall.
   * @param {Array<Models.File>} items
   */
  changeSelectedItems(items) {
    this.set('selectedItems', items);
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
    filesystemChanged() {
      this.scheduleTargetCheck(0);
    },
    changeSelectedItems(items) {
      return this.changeSelectedItems(items);
    },
  },
});
