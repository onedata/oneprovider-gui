/**
 * Generates XRootD API templates for `onedata-connection` (sent on handshake).
 * 
 * These mocks are used both in development (mocked) environment and tests - so if
 * specific data is needed in tests or development extend the resulting object.
 * Edit this file carefully!
 * 
 * @module utils/mocks/generate-xrootd-api-templates
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default function generateXrootdApiTemplates() {
  return {
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
}
