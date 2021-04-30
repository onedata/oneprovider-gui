import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';

export default FbTableRowColumns.extend({
  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,
});
