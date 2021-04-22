/**
 * Generates REST API templates for `onedata-connection` (sent on handshake).
 * 
 * These mocks are used both in development (mocked) environment and tests - so if
 * specific data is needed in tests or development extend the resulting object.
 * Edit this file carefully!
 * 
 * @module utils/mocks/generate-rest-api-templates
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default function generateRestApiTemplates() {
  return {
    listSharedDirectoryChildren: sharedRestFileTemplate('children'),
    downloadSharedFileContent: sharedRestFileTemplate('content'),
    getSharedFileAttributes: sharedRestFileTemplate(''),
    getSharedFileJsonMetadata: sharedRestFileTemplate('metadata/json'),
    getSharedFileRdfMetadata: sharedRestFileTemplate('metadata/rdf'),
    getSharedFileExtendedAttributes: sharedRestFileTemplate('metadata/xattrs'),
  };
}

export function sharedRestFileTemplate(operation) {
  return [
    'curl',
    '-L',
    `https://test.onedata.org/api/v3/onezone/shares/data/{id}/${operation}`,
  ];
}
