export default {
  header: '{{type}} details',
  file: 'File',
  dir: 'Directory',
  name: '{{type}} name',
  path: '{{type}} path',
  spaceId: 'Space ID',
  cdmiObjectId: 'File ID',
  modificationTime: 'Modified at',
  owner: 'Owner',
  close: 'Close',
  size: 'Size',
  rest: 'Public REST URL',
  restTag: 'REST',
  restTipIntro: 'The Onezone\'s public REST API can be used to access information and contents of all shared files and directories, without any authentication. It redirects to the corresponding REST API in one of the supporting Oneproviders. The Oneprovider is chosen dynamically and may change in time, so the redirection URL should not be cached.',
  restTipLinkName: 'REST API',
  restTipSpecificIntro: 'This endpoint returns {{typeDescription}}.',
  restTipSpecificType: {
    listSharedDirectoryChildren: 'the list of directory files and subdirectories',
    downloadSharedFileContent: 'the binary file content',
    getSharedFileAttributes: 'basic attributes of a file or directory',
    getSharedFileJsonMetadata: 'custom JSON metadata associated with a file or directory',
    getSharedFileRdfMetadata: 'custom RDF metadata associated with a file or directory',
    getSharedFileExtendedAttributes: 'custom extended attributes (xattrs) associated with a file or directory',
  },
  restUrlType: {
    listSharedDirectoryChildren: 'List directory files and subdirectories',
    downloadSharedFileContent: 'Download file content',
    getSharedFileAttributes: 'Get attributes',
    getSharedFileJsonMetadata: 'Get JSON metadata',
    getSharedFileRdfMetadata: 'Get RDF metadata',
    getSharedFileExtendedAttributes: 'Get extended attributes (xattrs)',
  },
};
