/**
 * A mocked abstraction layer for Onedata Sync API Websocket connection properties
 * For properties description see non-mocked `services/onedata-connection`
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataConnection from 'onedata-gui-websocket-client/services/mocks/onedata-connection';

export default OnedataConnection.extend({
  /**
   * @override
   */
  attributes: Object.freeze({
    transfersHistoryLimitPerFile: 100,
    openfaasAvailable: true,
    bagitUploaderWorkflowSchemaId: null,
    serviceVersion: '21.02',
    serviceBuildVersion: 'aabbcc',
  }),
});
