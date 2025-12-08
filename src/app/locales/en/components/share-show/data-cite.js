import common from './-common';

const visualNotAvailable = (componentMode) =>
  `Visual ${componentMode} for DataCite metadata is not available yet.`;

export default {
  header: 'DataCite metadata',
  visualNotAvailable: {
    show: visualNotAvailable('viewer'),
    edit: visualNotAvailable('editor'),
    create: visualNotAvailable('editor'),
  },
  metadataEditorIntro: common.metadataEditorIntro,
  introTip: common.editorHeaderTipCommon,
  readonlyHeaderTip: common.metadataPublicHeaderTip.dataCite,
  introExtra: common.metadataEditorIntroExtra.dataCite,
  modify: common.modify,
  modifyingButtonTip: common.modifyingButtonTip,
  validation: {
    empty: 'Metadata cannot be empty.',
    xmlInvalid: 'Metadata XML syntax is invalid.',
  },
};
