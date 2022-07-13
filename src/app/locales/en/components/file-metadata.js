export default {
  body: {
    editorDisabled: 'Editor disabled',
    metadataIsProtected: '{{fileTypeUpper}} metadata is write protected.',
    file: 'File',
    dir: 'Directory',
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
    disabledReason: {
      validating: 'Metadata validation in progress...',
      noChanges: 'No unsaved changes',
      someInvalid: 'Entered metadata is invalid – please correct',
    },
    unsavedChanges: 'Unsaved changes',
    updatingMetadata: 'updating metadata',
    updatingXattrs: 'updating xattrs',
  },
  rdf: {
    invalidXml: 'XML is not valid',
  },
  json: {
    invalidJson: 'JSON is not valid',
  },
  xattrs: {
    validation: {
      reservedKey: 'This key is reserved',
    },
  },
};
