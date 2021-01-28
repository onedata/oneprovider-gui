import headerManagemenet from './share-show/header-management';
import footerPublic from './share-show/footer-public';
import publicUrlViewer from './share-show/public-url-viewer';
import paneDescription from './share-show/pane-description';
import paneFiles from './share-show/pane-files';
import paneOpendata from './share-show/pane-opendata';
import openDataCommon from './share-show/open-data-common';
import openDataEditor from './share-show/open-data-editor';
import markdownEditor from './share-show/markdown-editor';

export default {
  tabs: {
    opendata: 'Open Data',
    description: 'Description',
    files: 'Files',
    filesDeleted: 'Files <span class="text-danger">(deleted)</span>',
    publishOpenData: 'Publish as Open Data',
  },

  // sub-components
  headerManagemenet,
  footerPublic,
  publicUrlViewer,
  paneDescription,
  paneFiles,
  paneOpendata,
  openData: Object.assign({}, openDataCommon, openDataEditor),
  markdownEditor,
};
