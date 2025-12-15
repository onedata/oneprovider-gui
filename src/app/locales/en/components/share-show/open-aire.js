import common from './-common';

const visualNotAvailable = (componentMode) =>
  `Visual ${componentMode} for OpenAIRE metadata is not available yet.`;

export default {
  header: 'OpenAIRE metadata',
  visualNotAvailable: {
    show: visualNotAvailable('viewer'),
    edit: visualNotAvailable('editor'),
    create: visualNotAvailable('editor'),
  },
  metadataEditorIntro: common.metadataEditorIntro,
  introTip: common.editorHeaderTipCommon,
  readonlyHeaderTip: common.metadataPublicHeaderTip.openAire,
  introExtra: common.metadataEditorIntroExtra.openAire,
  modify: common.modify,
  modifyingButtonTip: common.modifyingButtonTip,
  validation: {
    empty: 'Metadata cannot be empty.',
    xmlInvalid: 'Metadata XML syntax is invalid.',
  },
};
