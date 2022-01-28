/**
 * A mocked abstraction layer for Onedata Sync API Websocket connection properties
 * For properties description see non-mocked `services/onedata-connection`
 *
 * @module services/mocks/onedata-connection
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataConnection from 'onedata-gui-websocket-client/services/mocks/onedata-connection';
import generateXrootdApiTemplates from 'oneprovider-gui/utils/mocks/generate-xrootd-api-templates';
import generateRestApiTemplates from 'oneprovider-gui/utils/mocks/generate-rest-api-templates';

export default OnedataConnection.extend({
  /**
   * @override
   */
  attributes: Object.freeze({
    transfersHistoryLimitPerFile: 100,
    apiTemplates: Object.freeze({
      rest: generateRestApiTemplates(),
      xrootd: generateXrootdApiTemplates(),
    }),
    openfaasAvailable: true,
    bagitUploaderWorkflowSchemaId: null,
  }),
});
