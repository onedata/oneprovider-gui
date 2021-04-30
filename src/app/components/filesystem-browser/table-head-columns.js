// FIXME: jsdoc, note that there should be n+1 columns (n is number of cols in table-row-columns), because first (name) column is custom

import FbTableHeadColumns from 'oneprovider-gui/components/file-browser/fb-table-head-columns';

export default FbTableHeadColumns.extend({
  classNames: ['filesystem-table-head-columns'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableHeadColumns',
});
