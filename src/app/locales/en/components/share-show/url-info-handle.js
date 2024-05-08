import urlInfoCommon from './url-info-common';
import { handleServiceTextMore } from './pane-opendata';

export default {
  intro: 'Publicly accessible link of the Open Data record that was registered for this share. Redirects to the same browser as the public share link. In addition, this link is advertised via Open Data metadata harvesting protocol OAI PMH so that it is discoverable in Open Data indices. Anyone with the link will be able to access the share browser, without any authentication.',
  handleId: 'Handle ID',
  handleIdTip: 'Onedata <strong>handle</strong> represents an Open Data record, holding its metadata, public identifier, and a reference to the data collection.',
  handleServiceIdTip: handleServiceTextMore,
  handleServiceId: 'Handle service ID',
  handleServiceInfoText: 'This record is registered in <strong>{{handleServiceName}}</strong> handle service.',
  selectorInfo: urlInfoCommon.selectorInfo,
};
