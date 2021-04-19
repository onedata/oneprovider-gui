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

export const xRootDTemplates = {
  downloadSharedFileContent: [
    'xrdcp',
    'root://test.onedata.org//data/{spaceId}/{spaceId}/{shareId}{path}',
    '.',
  ],
  downloadSharedDirectoryContent: [
    'xrdcp',
    '-r',
    'root://test.onedata.org//data/{spaceId}/{spaceId}/{shareId}{path}',
    '.',
  ],
  listSharedDirectoryChildren: [
    'xrdfs',
    'root://xrootd.hub.archiver-otc.eu',
    'ls',
    '/data/{spaceId}/{spaceId}/{shareId}{path}',
  ],
};

export default OnedataConnection.extend({
  /**
   * @override
   */
  attributes: Object.freeze({
    transfersHistoryLimitPerFile: 100,
    apiTemplates: Object.freeze({
      rest: {
        listSharedDirectoryChildren: sharedRestFileTemplate('children'),
        downloadSharedFileContent: sharedRestFileTemplate('content'),
        getSharedFileAttributes: sharedRestFileTemplate(''),
        getSharedFileJsonMetadata: sharedRestFileTemplate('metadata/json'),
        getSharedFileRdfMetadata: sharedRestFileTemplate('metadata/rdf'),
        getSharedFileExtendedAttributes: sharedRestFileTemplate('metadata/xattrs'),
      },
      xrootd: xRootDTemplates,
    }),
  }),
});

export function sharedRestFileTemplate(operation) {
  return [
    'curl',
    '-L',
    `https://test.onedata.org/api/v3/onezone/shares/data/{id}/${operation}`,
  ];
}
