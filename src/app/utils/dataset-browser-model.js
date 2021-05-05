// FIXME: jsdoc

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import { hash } from 'ember-awesome-macros';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { computed } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

const buttonNames = Object.freeze([
  'btnRefresh',
  'btnShowFile',
]);

export default BaseBrowserModel.extend({
  /**
   * @override
   */
  i18nPrefix: 'utils.datasetBrowserModel',

  /**
   * Function argument: data for getDataUrl Onezone function
   * @override
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @override
   */
  rowComponentName: 'dataset-browser/table-row',

  /**
   * @override
   */
  statusBarComponentName: 'dataset-browser/table-row-status-bar',

  /**
   * @override
   */
  mobileInfoComponentName: 'dataset-browser/table-row-mobile-info',

  /**
   * @override
   */
  columnsComponentName: 'dataset-browser/table-row-columns',

  /**
   * @override
   */
  headColumnsComponentName: 'dataset-browser/table-head-columns',

  /**
   * @override
   */
  browserClass: 'dataset-browser',

  /**
   * @override
   */
  allButtonsHash: hash(...buttonNames),

  _window: window,

  navigateDataTarget: '_top',

  //#region Action buttons

  btnShowFile: computed('selectionContext', function btnShowFile() {
    const selectionContext = this.get('selectionContext');
    return this.createFileAction({
      id: 'showFile',
      icon: 'browser-' +
        (selectionContext === actionContext.singleFile ? 'file' : 'directory'),
      title: this.t(
        'fileActions.showFile.' +
        (selectionContext === actionContext.singleFile ? 'file' : 'dir')
      ),
      disabled: false,
      action: (datasets) => {
        return this.showRootFile(datasets[0]);
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
      ],
    });
  }),

  //#endregion

  showRootFile(dataset) {
    const {
      _window,
      getDataUrl,
      navigateDataTarget,
    } = this.getProperties('_window', 'getDataUrl', 'navigateDataTarget');
    const fileId = dataset.relationEntityId('rootFile');
    const url = getDataUrl({ fileId: null, selected: [fileId] });
    return _window.open(url, navigateDataTarget);
  },
});
