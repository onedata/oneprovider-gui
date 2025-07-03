import urlInfoCommon from './url-info-common';
import { handleServiceTextMore } from './pane-publicdata';

export default {
  intro: 'Publicly accessible link of the Public Data record that was registered for this share. Redirects to the same browser as the share link. In addition, this link is advertised via Public Data metadata harvesting protocol OAI PMH so that it is discoverable in Public Data indices. Anyone with the link will be able to access the share browser, without any authentication.',
  handleId: 'Handle ID',
  handleIdTip: 'Onedata <strong>handle</strong> represents a Public Data record, holding its metadata, public identifier, and a reference to the data collection.',
  handleServiceIdTip: handleServiceTextMore,
  handleServiceId: 'Handle service ID',
  handleServiceInfoText: 'This record is registered in <strong>{{handleServiceName}}</strong> handle service.',
  selectorInfo: urlInfoCommon.selectorInfo,
};
