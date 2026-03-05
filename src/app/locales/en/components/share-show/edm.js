import common from './-common';
import shareValidation from './edm/share-validation';
export const imageNotFound = 'Cannot load representative image';

const metadataNotValid = 'Metadata is not valid';

export default {
  shareValidation,
  header: 'Europeana Data Model (EDM) metadata',
  headerMobile: 'Metadata',
  metadataEditorIntro: common.metadataEditorIntro,
  introTip: `${common.editorHeaderTipCommon} You may use the visual editor that will generate the EDM XML metadata for you.`,
  readonlyHeaderTip: common.metadataPublicHeaderTip.edm,
  introExtra: common.metadataEditorIntroExtra.edm,
  modify: common.modify,
  modifyingButtonTip: common.modifyingButtonTip,
  invalidXml: 'The XML source cannot be parsed to EDM metadata. Review your XML.',
  applyAndFormatXml: 'Apply and format XML',
  discardXmlChanges: 'Discard changes',
  notValid: 'Metadata definition is not valid',
  definitionValid: 'Metadata definition is valid.',
  definitionValidating: 'Validating...',
  submitDisabledReason: {
    empty: 'Metadata must not be empty',
    invalid: metadataNotValid,
    xmlNotValid: 'XML is not valid',
    validatingSync: 'XML validation is pending',
    xmlNotAccepted: 'You must first apply or discard changes to the XML source',
    noChanges: 'There are no changes in the metadata',
  },
  submitWarningIconReason: {
    invalid: metadataNotValid,
  },
  imageNotFound,
  xmlInvalid: 'XML data is invalid',
  xmlParseError: 'XML syntax error or invalid EDM XML structure',
};
