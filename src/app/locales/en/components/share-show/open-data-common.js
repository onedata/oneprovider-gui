export const createPublicHeaderTip = (metadataType) =>
  `Handle metadata provides detailed information about the dataset for its consumers and is used to index the dataset in Open Data search engines. It is expressed in a unified format called ${metadataType}, based on XML.`;

export default {
  dcElementNames: {
    title: 'Title',
    creator: 'Creator',
    contributor: 'Contributor',
    subject: 'Subject',
    description: 'Description',
    publisher: 'Publisher',
    date: 'Date',
    type: 'Type',
    format: 'Format',
    identifier: 'Identifier',
    source: 'Source',
    language: 'Language',
    relation: 'Relation',
    coverage: 'Coverage',
    rights: 'Rights',
  },
  metadata: 'Dublin Core Metadata',
  metadataMobile: 'Metadata',
  metadataPublicHeaderTip: {
    dc: createPublicHeaderTip('Dublin Core'),
    edm: createPublicHeaderTip('Europeana Data Model'),
  },
  metadataEditorIntro: 'Handle metadata is used to index the dataset in Open Data search engines and provide additional information for its consumers.',
};
