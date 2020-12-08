import headerManagemenet from './share-show/header-management';
import footerPublic from './share-show/footer-public';

export default {
  headerManagemenet,
  footerPublic,
  paneDescription: {
    typeDescriptionPlaceholder: 'Type description in Markdown here...',
    noDescriptionWelcome: {
      title: 'No share description',
      content: ' It is recommended to add a description to your shared dataset ‐ it will help users understand and utilize its contents.',
      startButton: 'Create description',
    },
  },
  paneFiles: {
    fileDeleted: {
      title: 'Shared files have been deleted',
    },
  },
  paneOpendata: {
    publishWelcome: {
      title: 'Publish as Open Data',
      content: 'You can register this shared dataset in a handle service - it will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via OAI PMH protocol. This process will make your dataset globally available (without an account in Onedata) and anyone will be able to search for it in the Open Data indexes. To that end, in the next step you should provide as much information as possible in the Dublin Core metadata that will be attached to this dataset.',
      publishButton: 'Proceed',
    },
    noHandleServices: {
      title: 'No handle services available',
      content: 'You do not have access to any handle service, which is necessary to register Open Data handles. You can either create a new handle service (requires <code>oz_handle_services_create</code> admin privilege), or contact the site administrators and ask for access to an existing handle service.',
    },
    xmlTextareaPlaceholder: 'Type Dublin Core metadata here...',
    discard: 'Discard',
    editXml: 'Edit XML',
    openVisualEditor: 'Open visual editor',
    preview: 'Preview',
    xmlEditor: 'XML editor',
  },
};
