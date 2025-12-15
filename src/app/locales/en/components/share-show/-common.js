export const createPublicHeaderTip = (metadataType) =>
  `Metadata is used to describe the Public Data record, providing vital information for its consumers, and making it indexable in Public Data search engines. This record uses the ${metadataType} format, based on XML/RDF.`;

export const createEditorIntroExtra = (metadataTypeAbbrev) =>
  `Carefully compose the ${metadataTypeAbbrev} metadata below, putting down as much information as possible.`;

export default {
  metadataMobile: 'Metadata',
  metadataPublicHeaderTip: {
    dc: createPublicHeaderTip('Dublin Core (DC)'),
    edm: createPublicHeaderTip('Europeana Data Model (EDM)'),
    dataCite: createPublicHeaderTip('DataCite'),
    openAire: createPublicHeaderTip('OpenAIRE'),
  },
  metadataEditorIntro: 'Metadata is used to describe the Public Data record, providing vital information for its consumers, and making it indexable in Public Data search engines. All metadata formats are based on XML/RDF.',
  metadataEditorIntroExtra: {
    dc: createEditorIntroExtra('DC'),
    edm: createEditorIntroExtra('EDM'),
    dataCite: createEditorIntroExtra('DataCite'),
    openAire: createEditorIntroExtra('OpenAIRE'),
  },
  modify: 'Modify',
  modifyingButtonTip: 'Modify the metadata in the editor below and use the buttons at the bottom to save changes or cancel',
  editorHeaderTipCommon: 'Providing rich metadata will make it easier for the record to be found and utilized. The metadata will be registered alongside the persistent identifier and visible in Public Data indexing services.',
};
