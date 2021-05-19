import Mixin from '@ember/object/mixin';
import { get } from '@ember/object';
import removeObjectsFirstOccurence from 'onedata-gui-common/utils/remove-objects-first-occurence';
import { later } from '@ember/runloop';
import $ from 'jquery';
import { conditional, raw } from 'ember-awesome-macros';
import { resolve } from 'rsvp';

export default Mixin.create({
  // required fileManager: Ember.Service
  // required globalNotify: Ember.Service
  // required isMobile: Ember.Service
  // required loadingIconFileIds: Array<String>
  // optional previewMode: Boolean

  /**
   * Reference to Body object - can be stubbed for testing purposes.
   * @type {HTMLBodyElement}
   */
  _body: document.body,

  /**
   * Reference to Window object - can be stubbed for testing purposes.
   * @type {Window}
   */
  _window: window,

  downloadScope: conditional('previewMode', raw('public'), raw('private')),

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
        downloadScope ? 'public' : 'private'
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
    const isMobileBrowser = this.get('isMobile.any');
    const fileUrl = data && get(data, 'fileUrl');
    if (fileUrl) {
      if (isMobileBrowser) {
        this.downloadUsingOpen(fileUrl);
      } else {
        this.downloadUsingIframe(fileUrl);
      }
    } else {
      throw { isOnedataCustomError: true, type: 'empty-file-url' };
    }
  },

  downloadUsingIframe(fileUrl) {
    const _body = this.get('_body');
    const iframe = $('<iframe/>').attr({
      src: fileUrl,
      style: 'display:none;',
    }).appendTo(_body);
    // the time should be long to support some download extensions in Firefox desktop
    later(() => iframe.remove(), 60000);
  },

  downloadUsingOpen(fileUrl) {
    // Apple devices such as iPad tries to open file using its embedded viewer
    // in any browser, but we cannot say if the file extension is currently supported
    // so we try to open every file in new tab.
    const target = this.get('isMobile.apple.device') ? '_blank' : '_self';
    this.get('_window').open(fileUrl, target);
  },
});
