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
  maxDisplayFiles: 10,

  processing: false,

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
      } = this.getProperties(
        'files',
        'onHide',
        'globalNotify',
        'errorExtractor',
        'i18n',
        'i18nPrefix',
        'fileManager',
        'parentDir',
      );
      const filesToRemove = [...files];
      this.set('processing', true);

      return handleMultiFilesOperation({
            files: filesToRemove,
            globalNotify,
            errorExtractor,
            i18n,
            operationErrorKey: `${i18nPrefix}.deleting`,
          },
          (file) => file.destroyRecord()
        )
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
