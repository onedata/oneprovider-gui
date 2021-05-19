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
import I18n from 'onedata-gui-common/mixins/components/i18n';

const allButtonNames = Object.freeze([
  'btnRefresh',
  'btnDownloadTar',
]);

export default BaseBrowserModel.extend(I18n, {
  modalManager: service(),
  datasetManager: service(),
  globalNotify: service(),

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

  // FIXME: file or dir dataset icon based on parent dataset type
  /**
   * @override
   */
  rootIcon: 'browser-dataset',

  /**
   * @override
   */
  currentDirTranslation: computedT('currentDataset'),

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
        // FIXME: use mixin to implement download action, or import as btn/action
        action: (files) => {
          return this.downloadFiles(files);
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
});
