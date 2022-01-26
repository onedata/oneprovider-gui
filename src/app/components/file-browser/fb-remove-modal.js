/**
 * Shows confirmation modal to remove a file and implements remove action
 *
 * @module components/fb-remove-modal
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import { inject as service } from '@ember/service';
import { bool, sum, array, and, raw } from 'ember-awesome-macros';
import { resolve, all as allFulfilled } from 'rsvp';

export default Component.extend(I18n, {
  tagName: '',

  fileManager: service(),
  i18n: service(),
  errorExtractor: service(),
  globalNotify: service(),
  store: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbRemoveModal',

  open: false,

  /**
   * @virtual
   * @type {models/File}
   */
  files: undefined,

  /**
   * @virtual
   * @type {models/File}
   */
  parentDir: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   * @param {boolean} removeInvoked
   * @param {object} removeResults result of remove promises hashSettled
   */
  onHide: notImplementedIgnore,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  firstFile: reads('files.firstObject'),

  /**
   * If there are more files to delete than this number, do not display files
   * list, just number of files.
   * @type {number}
   */
  maxDisplayFiles: 8,

  /**
   * @type {Boolean}
   */
  processing: false,

  /**
   * Includes also files, which deletion failed. Updated when removing process is pending.
   * @type {Number}
   */
  filesProcessedCount: 0,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  filesContainDirectory: array.isAny('files', raw('type'), raw('dir')),

  /**
   * @type {ComputedProperty<Number>}
   */
  filesToRemoveCount: reads('files.length'),

  /**
   * @type {ComputedProperty<Number>}
   */
  sharedFilesToRemoveCount: array.length(array.filterBy('files', raw('sharesCount'))),

  /**
   * @type {ComputedProperty<Number>}
   */
  sharesToRemoveCount: sum(array.compact(array.mapBy('files', raw('sharesCount')))),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  canViewShares: bool('spacePrivileges.view'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  canRemoveShares: bool('spacePrivileges.manageShares'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  shouldRemoveShares: and(
    'sharesToRemoveCount',
    'canViewShares',
    'canRemoveShares'
  ),

  /**
   * Controls message displayed to user what is going to be removed.
   * One of: file, dir, multi, multiMany
   * @type {ComputedProperty<string>}
   */
  itemsType: computed('files.{length,0.type}', 'maxDisplayFiles', function itemsType() {
    const files = this.get('files');
    const maxDisplayFiles = this.get('maxDisplayFiles');
    const filesCount = get(files, 'length');
    if (get(files, 'length') === 1) {
      return get(files[0], 'type');
    } else {
      return filesCount <= maxDisplayFiles ? 'multi' : 'multiMany';
    }
  }),

  /**
   * @type {ComputedProperty<HtmlSafe>}
   */
  sharesCountInfo: computed(
    'sharedFilesToRemoveCount',
    'sharesToRemoveCount',
    'filesToRemoveCount',
    function sharesCountInfo() {
      const {
        sharedFilesToRemoveCount,
        sharesToRemoveCount,
        filesToRemoveCount,
      } = this.getProperties(
        'sharedFilesToRemoveCount',
        'sharesToRemoveCount',
        'filesToRemoveCount'
      );

      let i18nPath = 'sharesCountInfo.';
      i18nPath += filesToRemoveCount > 1 ? 'forManySelected.' : 'forOneSelected.';
      i18nPath += sharedFilesToRemoveCount > 1 ? 'andManyShared.' : 'andOneShared.';
      const suffixI18nPath = i18nPath +
        (sharesToRemoveCount > 1 ? 'suffixManyShares' : 'suffixOneShare');

      return this.t(`${i18nPath}prefix`, { filesCount: sharedFilesToRemoveCount }) +
        this.t(suffixI18nPath, { sharesCount: sharesToRemoveCount });
    }
  ),

  /**
   * @type {ComputedProperty<HtmlSafe>}
   */
  removingSharesInfo: computed(
    'sharedFilesToRemoveCount',
    'sharesToRemoveCount',
    'canRemoveShares',
    function removingSharesInfo() {
      const {
        sharedFilesToRemoveCount,
        sharesToRemoveCount,
        canRemoveShares,
      } = this.getProperties(
        'sharedFilesToRemoveCount',
        'sharesToRemoveCount',
        'canRemoveShares'
      );

      const i18nPath = 'removingSharesInfo.';
      const prefixI18nPath = i18nPath +
        (sharedFilesToRemoveCount > 1 ? 'forManySharedPrefix' : 'forOneSharedPrefix');
      let suffixI18nPath = i18nPath + 'suffix.';
      suffixI18nPath += sharesToRemoveCount > 1 ? 'forManyShares.' : 'forOneShare.';
      suffixI18nPath += canRemoveShares ? 'withPrivileges' : 'withoutPrivileges';

      return this.t(prefixI18nPath) + this.t(suffixI18nPath);
    }
  ),

  actions: {
    remove() {
      const {
        files,
        onHide,
        globalNotify,
        errorExtractor,
        i18n,
        i18nPrefix,
        fileManager,
        parentDir,
        shouldRemoveShares,
      } = this.getProperties(
        'files',
        'onHide',
        'globalNotify',
        'errorExtractor',
        'i18n',
        'i18nPrefix',
        'fileManager',
        'parentDir',
        'shouldRemoveShares'
      );
      const filesToRemove = [...files];
      this.set('processing', true);

      return handleMultiFilesOperation({
          files: filesToRemove,
          globalNotify,
          errorExtractor,
          i18n,
          operationErrorKey: `${i18nPrefix}.deleting`,
        }, (file) => {
          let promise;
          if (shouldRemoveShares) {
            promise = get(file, 'shareRecords').then(shares =>
              allFulfilled(shares.map(share => share.destroyRecord()))
            );
          } else {
            promise = resolve();
          }
          return promise.then(() => file.destroyRecord())
            .finally(() =>
              safeExec(this, () => this.incrementProperty('filesProcessedCount'))
            );
        })
        .then(results => {
          filesToRemove.forEach(file => {
            const stateName = get(file, 'currentState.stateName');
            if (stateName.endsWith('uncommitted')) {
              file.rollbackAttributes();
            }
          });
          return fileManager.dirChildrenRefresh(get(parentDir, 'entityId'))
            .then(() => results);
        })
        .then(results => {
          onHide.bind(this)(true, results);
        })
        .finally(() => {
          safeExec(this, 'set', 'processing', false);
        });
    },
    close() {
      return this.get('onHide')(false);
    },
  },
});
