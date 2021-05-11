export default {
  header: '{{type}} details',
  name: '{{type}} name',
  path: '{{type}} location',
  symlinkTargetPath: 'Symbolic link target path',
  unknownSpaceInSymlink: 'unknown space',
  spaceId: 'Space ID',
  cdmiObjectId: 'File ID',
  modificationTime: 'Modified at',
  owner: 'Owner',
  close: 'Close',
  size: 'Size',
  api: 'Public API',
  apiCommandTipIntro: {
    rest: 'The Onezone\'s public REST API can be used to access information and contents of all shared files and directories, without any authentication. It redirects to the corresponding REST API in one of the supporting Oneproviders. The Oneprovider is chosen dynamically and may change in time, so the redirection URL should not be cached.',
    xrootd: 'This environment offers an XRootD server that exposes all Open Data collections (shared files and directories that had been registered under a handle) for public, read-only access. Below are some basic XRootD commands that can be used to browse and download the data, assuming that the XRootD CLI tools are already installed.',
  },
  apiCommandTipLinkName: {
    rest: 'REST API',
    xrootd: 'XRootD',
  },
  apiCommandTipSpecificIntro: {
    rest: 'This endpoint returns {{typeDescription}}.',
    xrootd: 'This shell command {{typeDescription}}.',
  },
  apiCommandTipSpecificType: {
    rest: {
      listSharedDirectoryChildren: 'the list of directory files and subdirectories',
      downloadSharedFileContent: 'the binary file content',
      downloadSharedDirectoryContent: 'a TAR archive with directory contents',
      getSharedFileAttributes: 'basic attributes of a file or directory',
      getSharedFileJsonMetadata: 'custom JSON metadata associated with a file or directory',
      getSharedFileRdfMetadata: 'custom RDF metadata associated with a file or directory',
      getSharedFileExtendedAttributes: 'custom extended attributes (xattrs) associated with a file or directory',
    },
    xrootd: {
      listSharedDirectoryChildren: 'returns the list of directory files and subdirectories',
      downloadSharedFileContent: 'downloads the file',
      downloadSharedDirectoryContent: 'downloads the directory recursively',
    },
  },
  apiCommandTitle: {
    rest: {
      listSharedDirectoryChildren: 'List directory files and subdirectories',
      downloadSharedFileContent: 'Download file content',
      downloadSharedDirectoryContent: 'Download directory (tar)',
      getSharedFileAttributes: 'Get attributes',
      getSharedFileJsonMetadata: 'Get JSON metadata',
      getSharedFileRdfMetadata: 'Get RDF metadata',
      getSharedFileExtendedAttributes: 'Get extended attributes (xattrs)',
    },
    xrootd: {
      listSharedDirectoryChildren: 'List directory files and subdirectories',
      downloadSharedFileContent: 'Download file',
      downloadSharedDirectoryContent: 'Download directory (recursively)',
    },
  },
  apiType: {
    rest: 'REST',
    xrootd: 'XRootD',
  },
  fileType: {
    file: 'file',
    dir: 'directory',
    symlink: 'symbolic link',
  },
  tabs: {
    general: {
      tabTitle: 'General',
    },
    hardlinks: {
      tabTitle: 'Hard links ({{hardlinksCount}})',
      showingOnlyNFirst: 'Showing only {{limit}} first hard links.',
      andNMoreYouHaveNoAccess: 'And {{count}} more that you cannot access.',
      noAccessToAll: 'You do not have access to the hard links of this {{fileType}}.',
      hardlinksFetchSingleErrorTip: 'Cannot load files due to error: "{{fetchError}}".',
      hardlinksFetchMultiErrorTip: 'Cannot load files due to error: "{{fetchError}}" and {{moreCount}} more errors.',
      unknownFetchError: 'unknown error',
    },
  },
  hardlinkEntry: {
    pathLabel: 'Path',
    unknownPath: 'unknown',
  },
};
