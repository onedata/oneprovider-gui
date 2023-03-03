/**
 * Adds methods for downloading files in browsers components.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { get } from '@ember/object';
import removeObjectsFirstOccurence from 'onedata-gui-common/utils/remove-objects-first-occurence';
import { conditional, raw } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import downloadFile from 'onedata-gui-common/utils/download-file';

export default Mixin.create({
  // required fileManager: Ember.Service
  // required globalNotify: Ember.Service
  // required loadingIconFileIds: Array<String>
  // optional previewMode: Boolean

  /**
   * Reference to Window object - can be stubbed for testing purposes.
   * @type {Window}
   */
  _window: window,

  downloadScope: conditional('previewMode', raw('public'), raw('private')),

  /**
   * @param {Array<string>} fileIds
   * @returns {Promise}
   */
  downloadFilesById(fileIds) {
    const {
      fileManager,
      globalNotify,
      downloadScope,
      loadingIconFileIds,
    } = this.getProperties(
      'fileManager',
      'globalNotify',
      'downloadScope',
      'loadingIconFileIds'
    );
    if (!get(fileIds, 'length')) {
      return resolve();
    }
    // intentionally not checking for duplicates, because we treat multiple "loading id"
    // entries as semaphores
    loadingIconFileIds.pushObjects(fileIds);
    return fileManager.getFileDownloadUrl(
        fileIds,
        downloadScope
      )
      .then((data) => this.handleFileDownloadUrl(data))
      .catch((error) => {
        globalNotify.backendError(this.t('startingDownload'), error);
        throw error;
      })
      .finally(() => {
        removeObjectsFirstOccurence(loadingIconFileIds, fileIds);
      });
  },

  handleFileDownloadUrl(data) {
    const fileUrl = data && get(data, 'fileUrl');

    if (fileUrl) {
      downloadFile({ fileUrl, _window: this._window });
    } else {
      throw { isOnedataCustomError: true, type: 'empty-file-url' };
    }
  },
});
