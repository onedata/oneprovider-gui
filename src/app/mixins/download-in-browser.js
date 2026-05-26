/**
 * Adds methods for downloading files in browsers components.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import removeObjectsFirstOccurence from 'onedata-gui-common/utils/remove-objects-first-occurence';
import { conditional, raw } from 'ember-awesome-macros';
import downloadFile from 'onedata-gui-common/utils/download-file';
import DownloadStatusMonitor from 'oneprovider-gui/utils/download-status-monitor';
import { RawFileDownloadState } from 'oneprovider-gui/services/production/file-manager';

export default Mixin.create({
  // required fileManager: Ember.Service
  // required globalNotify: Ember.Service
  // required loadingIconFileIds: Array<String>
  // optional previewMode: Boolean

  downloadScope: conditional('previewMode', raw('public'), raw('private')),

  /**
   * @param {Array<string>} fileIds
   * @returns {Promise}
   */
  async downloadFilesById(fileIds) {
    const {
      fileManager,
      globalNotify,
      downloadScope,
      loadingIconFileIds,
    } = this;
    if (!fileIds?.length) {
      return;
    }
    // intentionally not checking for duplicates, because we treat multiple "loading id"
    // entries as semaphores
    loadingIconFileIds.pushObjects(fileIds);

    try {
      const urlData = await fileManager.getFileDownloadUrl(
        fileIds,
        downloadScope
      );
      const url = urlData.fileUrl;
      const downloadCode = getDownloadCode(url);
      const monitor = new DownloadStatusMonitor(
        this.fileManager,
        downloadCode,
        downloadScope
      );
      monitor.addListener((state, error) => {
        if (state === RawFileDownloadState.Failed) {
          globalNotify.backendError(this.t('downloading'), error);
        }
      });
      monitor.start();
      this.handleFileDownloadUrl(urlData);
      return monitor;
    } catch (error) {
      globalNotify.backendError(this.t('startingDownload'), error);
      throw error;
    } finally {
      removeObjectsFirstOccurence(loadingIconFileIds, fileIds);
    }
  },

  handleFileDownloadUrl(data) {
    const fileUrl = data?.fileUrl;

    if (fileUrl) {
      downloadFile({ fileUrl });
    } else {
      throw { isOnedataCustomError: true, type: 'empty-file-url' };
    }
  },
});

/**
 * FIXME: w backendzie powinno się pojawić pole z code i to nie będzie potrzebne
 * @param {string} url
 * @returns {string|undefined}
 */
function getDownloadCode(url) {
  return url.match(/.*\/(.*$)/)?.[1];
}
