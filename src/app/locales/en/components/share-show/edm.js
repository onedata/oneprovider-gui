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
  submitDisabledReason: {
    empty: 'Metadata must not be empty.',
    invalid: 'Metadata is not valid.',
  },
};
