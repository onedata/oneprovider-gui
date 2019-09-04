/**
 * Shows confirmation modal to remove a file and implements remove action
 * 
 * @module components/fb-remove-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
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

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbRemoveModal',

  proceedButtonClass: 'btn btn-danger proceed remove-proceed',

  open: false,

  /**
   * @virtual
   * @type {models/File}
   */
  files: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   * @param {boolean} removeInvoked
   * @param {object} removeResults result of remove promises hashSettled
   */
  onHide: notImplementedIgnore,

  /**
   * If there are more files to delete than this number, do not display files
   * list, just number of files.
   * @type {number}
   */
  maxDisplayFiles: 5,

  processing: false,

  modalClass: 'fb-remove-item-modal',

  /**
   * @type {ComputedProperty<string>}
   */
  itemsType: computed('files.[]', function itemsType() {
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
      } = this.getProperties(
        'files',
        'onHide',
        'globalNotify',
        'errorExtractor',
        'i18n',
        'i18nPrefix',
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
      ).then(results => {
        onHide.bind(this)(true, results);
      }).finally(() => {
        safeExec(this, 'set', 'processing', false);
      });
    },
    close() {
      return this.get('onHide')(false);
    },
  },
});
