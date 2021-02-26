import urlInfoCommon from './url-info-common';

export default {
  intro: 'Publicly accessible link of the Open Data handle that was registered for this share. Redirects to the same browser as the public share link. In addition, this link is advertised via Open Data metadata harvesting protocol OAI PMH so that it is discoverable in Open Data indices. Anyone with the link will be able to access the share browser, without an account in Onedata or any authentication.',
  handleId: 'Handle ID',
  handleServiceId: 'Handle service ID',
  handleServiceInfoText: 'This handle is registered in <strong>{{handleServiceName}}</strong> handle service.',
  selectorInfo: urlInfoCommon.selectorInfo,
};
