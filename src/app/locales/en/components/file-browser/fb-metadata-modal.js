export default {
  header: '{{type}} metadata',
  file: 'File',
  dir: 'Directory',
  types: {
    xattrs: 'basic',
    json: 'JSON',
    rdf: 'RDF',
  },
  tabStateHint: {
    blank: 'There is no {{type}} metadata set.',
    invalid: 'Entered {{type}} metadata is invalid ‐ please correct.',
    modified: 'There are unsaved changes in {{type}} metadata.',
    saved: '{{typeCapitalized}} metadata is present and saved.',
  },
  unsavedChanges: 'Unsaved changes',
  close: 'Close',
  saveAll: 'Save all',
  discardChanges: 'Discard changes',
  updatingMetadata: 'updating metadata',
  updatingXattrs: 'updating xattrs',
};
