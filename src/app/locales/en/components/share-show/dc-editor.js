import common from './-common';

// NOTE: This is a mixin to extend dc-common translations
export default {
  xmlTextareaPlaceholder: 'Type Dublin Core XML metadata here...',
  add: 'Add another',
  inputPlaceholder: 'Enter {{type}}...',
  addMetadataGroup: 'Choose metadata element',
  moreElements: 'Add more elements...',
  back: 'Back',
  xmlParserError: 'XML is not valid',
  metadataTextMore: `${common.editorHeaderTipCommon} You may use the visual editor that will generate the DC XML metadata for you.`,
  metadataEditorIntro: common.metadataEditorIntro,
  metadataEditorIntroExtra: common.metadataEditorIntroExtra.dc,
  modifyingButtonTip: common.modifyingButtonTip,
};
