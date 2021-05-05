// FIXME: jsdoc

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import { hash } from 'ember-awesome-macros';

const buttonNames = Object.freeze([
  'btnRefresh',
]);

export default BaseBrowserModel.extend({
  /**
   * @override
   */
  i18nPrefix: 'utils.datasetBrowserModel',

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
});
