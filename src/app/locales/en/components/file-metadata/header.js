export default {
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
  editorDisabled: 'Editor disabled',
};
