import { noMetadataSet, types } from './-common';

export default {
  types,
  tabStateHint: {
    blank: noMetadataSet,
    error: '{{typeCapitalized}} metadata could not be fetched.',
    invalid: 'Entered {{type}} metadata is invalid – please correct.',
    modified: 'There are unsaved changes in {{type}} metadata.',
    present: '{{typeCapitalized}} metadata is present.',
    saved: '{{typeCapitalized}} metadata is present and saved.',
    validating: '{{typeCapitalized}} metadata validation in progress...',
  },
  editorDisabled: 'Editor disabled',
  selectorHint: {
    viewDescription: 'This view allows managing custom metadata associated with files and directories.',
    metadataIntro: 'Every file or directory can have three types of metadata: extended attributes, JSON, and RDF. These can be set automatically (e.g., by scripts, middleware, or automation jobs) or manually by users. Custom metadata enables rich annotation of data and has various applications, such as provenance tracking, semantic search, data governance, or geospatial context mapping.',
    metadataAdditionalInfo: 'Notably, custom metadata facilitates data indexing and discovery, which is especially useful for managing large data collections.',
    docLinkName: 'metadata',
    close: 'OK',
  },
};
