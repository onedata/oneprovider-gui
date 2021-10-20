import headerManagemenet from './share-show/header-management';
import publicUrlViewer from './share-show/public-url-viewer';
import paneDescription from './share-show/pane-description';
import paneFiles from './share-show/pane-files';
import paneOpendata from './share-show/pane-opendata';
import openDataCommon from './share-show/open-data-common';
import openDataEditor from './share-show/open-data-editor';
import openDataPreview from './share-show/open-data-preview';
import openDataModeSwitch from './share-show/open-data-mode-switch';
import markdownEditor from './share-show/markdown-editor';
import urlInfoHandle from './share-show/url-info-handle';
import urlInfoShare from './share-show/url-info-share';
import urlInfoRest from './share-show/url-info-rest';

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
  publicUrlViewer,
  paneDescription,
  paneFiles,
  paneOpendata,
  openData: {
    common: openDataCommon,
    editor: openDataEditor,
    preview: openDataPreview,
  },
  openDataModeSwitch,
  markdownEditor,
  urlInfoHandle,
  urlInfoShare,
  urlInfoRest,
};
