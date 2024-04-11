import dcCommon, { editorHeaderTipCommon } from './dc-common';

const metadataEditorIntro = dcCommon.metadataEditorIntro;
const edmReadonlyTip = dcCommon.metadataPublicHeaderTip.edm;
const edmIntroExtra = dcCommon.metadataEditorIntroExtra.edm;
export const imageNotFound = 'Cannot load representative image';

export default {
  header: 'Europeana Data Model (EDM) metadata',
  headerMobile: 'Metadata',
  metadataEditorIntro,
  introTip: `${editorHeaderTipCommon} You may use the visual editor that will generate the EDM XML metadata for you.`,
  readonlyHeaderTip: edmReadonlyTip,
  introExtra: edmIntroExtra,
  invalidXml: 'The XML source cannot be parsed to EDM metadata. Review your XML.',
  applyAndFormatXml: 'Apply and format XML',
  notValid: 'Metadata definition is not valid',
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
  imageNotFound,
};
