/**
 * Implementation of browser-model (logic and co-related data) for archive-browser
 * (a browser for mananging archives list).
 *
 * @module utils/archive-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import { actionContext } from 'oneprovider-gui/components/file-browser';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';
import DownloadInBrowser from 'oneprovider-gui/mixins/download-in-browser';
import { all as allFulfilled } from 'rsvp';
import { conditional, equal, raw } from 'ember-awesome-macros';

const allButtonNames = Object.freeze([
  'btnRefresh',
  'btnDownloadTar',
]);

export default BaseBrowserModel.extend(DownloadInBrowser, {
  modalManager: service(),
  datasetManager: service(),

  // required by DownloadInBrowser mixin
  fileManager: service(),
  isMobile: service(),
  globalNotify: service(),

  /**
   * @override
   */
  downloadScope: 'private',

  /**
   * State of space-datasets container for datasets-browser.
   * Properties:
   * - `browsableDataset: String`
   * @virtual
   * @type {Object}
   */
  spaceDatasetsViewState: Object.freeze({}),

  /**
   * @override
   */
  i18nPrefix: 'utils.archiveBrowserModel',

  /**
   * @override
   */
  rowComponentName: 'archive-browser/table-row',

  /**
   * @override
   */
  statusBarComponentName: 'archive-browser/table-row-status-bar',

  /**
   * @override
   */
  mobileInfoComponentName: 'archive-browser/table-row-mobile-info',

  /**
   * @override
   */
  columnsComponentName: 'archive-browser/table-row-columns',

  /**
   * @override
   */
  headRowComponentName: 'archive-browser/table-head-row',

  /**
   * @override
   */
  emptyDirComponentName: 'archive-browser/empty-dir',

  /**
   * @override
   */
  browserClass: 'archive-browser',

  /**
   * @override
   */
  rootIcon: conditional(
    equal('spaceDatasetsViewState.browsableDataset.rootFileType', raw('file')),
    raw('browser-dataset-file'),
    raw('browser-dataset')
  ),

  /**
   * @override
   */
  currentDirTranslation: computedT('archiveList'),

  /**
   * @override
   */
  buttonNames: allButtonNames,

  _window: window,

  navigateDataTarget: '_top',

  //#region Action buttons

  btnDownloadTar: computed(
    function btnDownloadTar() {
      return this.createFileAction({
        id: 'downloadTar',
        icon: 'browser-download',
        action: (archives) => {
          return this.downloadArchives(archives);
        },
        showIn: [
          actionContext.singleFile,
          actionContext.singleFilePreview,
          actionContext.multiFile,
          actionContext.multiFilePreview,
        ],
      });
    }
  ),

  //#endregion

  async downloadArchives(archives) {
    const rootDirs = await allFulfilled(archives.mapBy('rootDir').compact());
    const fileIds = rootDirs.mapBy('entityId').compact();
    return this.downloadFilesById(fileIds);
  },
});
