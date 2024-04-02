import headerManagemenet from './share-show/header-management';
import publicUrlViewer from './share-show/public-url-viewer';
import paneDescription from './share-show/pane-description';
import paneFiles from './share-show/pane-files';
import paneOpendata from './share-show/pane-opendata';
import dcCommon from './share-show/dc-common';
import dcEditor from './share-show/dc-editor';
import dcPreview from './share-show/dc-preview';
import openDataModeSwitch from './share-show/open-data-mode-switch';
import markdownEditor from './share-show/markdown-editor';
import urlInfoHandle from './share-show/url-info-handle';
import urlInfoShare from './share-show/url-info-share';
import urlInfoRest from './share-show/url-info-rest';
import edm from './share-show/edm';
import metadataEditorFooter from './share-show/metadata-editor-footer';

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
  dc: {
    common: dcCommon,
    editor: dcEditor,
    preview: dcPreview,
  },
  openDataModeSwitch,
  markdownEditor,
  urlInfoHandle,
  urlInfoShare,
  urlInfoRest,
  edm,
  metadataEditorFooter,
};
