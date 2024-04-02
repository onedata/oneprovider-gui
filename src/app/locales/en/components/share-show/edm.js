import openDataCommon, { editorHeaderTipCommon } from './open-data-common';

const metadataEditorIntro = openDataCommon.metadataEditorIntro;
const edmReadonlyTip = openDataCommon.metadataPublicHeaderTip.edm;
const edmIntroExtra = openDataCommon.metadataEditorIntroExtra.edm;

export default {
  header: 'Europeana Data Model (EDM) metadata',
  metadataEditorIntro,
  introTip: `${editorHeaderTipCommon} The visual editor for EDM metadata is not yet implemented.`,
  readonlyHeaderTip: edmReadonlyTip,
  introExtra: edmIntroExtra,
  invalidXml: 'The XML source cannot be parsed to EDM metadata. Review your XML.',
  applyAndFormatXml: 'Apply and format XML',
  notValid: 'Metadata definition is not valid.',
  definitionValid: 'Metadata definition is valid.',
  definitionValidating: 'Validating...',
  synchronizedButton: 'XML synchronized',
  synchronizedButtonTip: 'The XML source is synchronized with the visual editor. If you change the XML content manually, you will be asked to apply changes which will also apply XML formatting.',
  submitDisabledReason: {
    empty: 'Metadata must not be empty',
    invalid: 'Metadata is not valid',
    xmlNotValid: 'XML is not valid',
    validatingSync: 'XML validation is pending',
    xmlNotAccepted: 'Apply the XML source first',
  },
};
