export const createPublicHeaderTip = (metadataType) =>
  `Metadata is used to describe the Open Data record, providing vital information for its consumers, and making it indexable in Open Data search engines. This record uses the ${metadataType} format, based on XML/RDF.`;

export const createEditorIntroExtra = (metadataTypeAbbrev) =>
  `Carefully compose the ${metadataTypeAbbrev} metadata below, putting down as much information as possible.`;

export const editorHeaderTipCommon =
  'Providing rich metadata will make it easier for the record to be found and utilized. The metadata will be registered alongside the persistent identifier and visible in Open Data indexing services.';

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
  metadata: 'Dublin Core (DC) metadata',
  metadataMobile: 'Metadata',
  metadataPublicHeaderTip: {
    dc: createPublicHeaderTip('Dublin Core (DC)'),
    edm: createPublicHeaderTip('Europeana Data Model (EDM)'),
  },
  metadataEditorIntro: 'Metadata is used to describe the Open Data record, providing vital information for its consumers, and making it indexable in Open Data search engines. All metadata formats are based on XML/RDF.',
  metadataEditorIntroExtra: {
    dc: createEditorIntroExtra('DC'),
    edm: createEditorIntroExtra('EDM'),
  },
  modify: 'Modify',
};
