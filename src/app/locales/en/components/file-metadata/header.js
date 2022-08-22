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
};
