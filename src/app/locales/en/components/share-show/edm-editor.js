import openDataCommon from './open-data-common';

const { metadataEditorIntro } = openDataCommon;

export default {
  header: 'Europeana Data Model Metadata',
  metadataEditorIntro,
  // using a non-breaking hyphen Unicode in the text below
  introTip: 'You have chosen the XML‑based <strong>European Data Model</strong> format to express your metadata. Provide as much detailed information as possible about your dataset, which will make it easier to be found and utilized. The metadata will be registered alongside the persistent identifier and visible in Open Data indexing services.',
  typeMetadata: {
    type: 'Type',
    edm: 'Europeana Data Model',
    metadataBelow: 'metadata below.',
  },
  submitDisabledReason: {
    empty: 'Metadata must not be empty.',
    invalid: 'Metadata XML is not valid.',
  },
};
