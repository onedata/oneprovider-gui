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
  discardXmlChanges: 'Discard changes',
  notValid: 'Metadata definition is not valid',
  definitionValid: 'Metadata definition is valid.',
  definitionValidating: 'Validating...',
  submitDisabledReason: {
    empty: 'Metadata must not be empty',
    invalid: 'Metadata is not valid',
    xmlNotValid: 'XML is not valid',
    validatingSync: 'XML validation is pending',
    xmlNotAccepted: 'You must first apply or discard changes to the XML source',
  },
  imageNotFound,
  xmlInvalid: 'XML data is invalid',
  xmlParseError: 'XML syntax error or invalid EDM XML structure',
};
