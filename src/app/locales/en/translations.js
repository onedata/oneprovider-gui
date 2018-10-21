import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';
import onedataWebsocketClientTranslations from './onedata-gui-websocket-client';

import data from './tabs/data';
import shares from './tabs/shares';
import transfers from './tabs/transfers';

import guiUtils from './services/gui-utils';

const translations = {
  tabs: {
    data,
    shares,
    transfers,
  },
  services: {
    guiUtils,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  onedataWebsocketClientTranslations,
  translations,
);
