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
    edm: createPublicHeaderTip('European Data Model'),
  },
  metadataTextMore: 'Handle metadata is expressed in a unified format called Dublin Core. It is based on XML, but you can use the visual editor below to generate it. Provide as much detailed information as possible about your dataset, which will make it easier to be found and utilized. The metadata will be registered alongside the persistent identifier and visible in Open Data indexing services.',
  metadataEditorIntro: 'Handle metadata is used to index the dataset in Open Data search engines and provide additional information for its consumers.',
};
