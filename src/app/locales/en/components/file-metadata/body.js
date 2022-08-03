export default {
  // FIXME: to implement below
  editorDisabled: 'Editor disabled',
  metadataIsProtected: '{{fileTypeUpper}} metadata is write protected.',
  file: 'File',
  dir: 'Directory',
  // FIXME: move to generic for metadata
  types: {
    xattrs: 'basic',
    json: 'JSON',
    rdf: 'RDF',
  },
  tabStateHint: {
    blank: 'There is no {{type}} metadata set.',
    error: '{{typeCapitalized}} metadata could not be fetched.',
    invalid: 'Entered {{type}} metadata is invalid – please correct.',
    modified: 'There are unsaved changes in {{type}} metadata.',
    present: '{{typeCapitalized}} metadata is present.',
    saved: '{{typeCapitalized}} metadata is present and saved.',
    validating: '{{typeCapitalized}} metadata validation in progress...',
  },
  unsavedChanges: 'Unsaved changes',
  // FIXME: is this used?
  updatingMetadata: 'updating metadata',
  updatingXattrs: 'updating xattrs',
};
