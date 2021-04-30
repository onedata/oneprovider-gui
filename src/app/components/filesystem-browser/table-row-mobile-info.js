import FbTableRowMobileInfo from 'oneprovider-gui/components/file-browser/fb-table-row-mobile-info';

export default FbTableRowMobileInfo.extend({
  classNames: ['filesystem-table-row-mobile-info'],

  /**
   * @override
   * FIXME: maybe not needed
   */
  i18nPrefix: 'components.filesystemBrowser.tableRowMobileInfo',

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,
});
