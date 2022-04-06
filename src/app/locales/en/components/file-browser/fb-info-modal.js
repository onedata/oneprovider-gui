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
  size: 'Size',
  guiUrl: '{{type}} URL',
  apiCommandTipIntro: {
    rest: 'The Onezone\'s public REST API can be used to access information and contents of all shared files and directories, without any authentication. It redirects to the corresponding REST API in one of the supporting Oneproviders. The Oneprovider is chosen dynamically and may change in time, so the redirection URL should not be cached.',
    xrootd: 'This environment offers an XRootD server that exposes all Open Data collections (shared files and directories that had been registered under a handle) for public, read-only access. Below are some basic XRootD commands that can be used to browse and download the data, assuming that the XRootD CLI tools are already installed.',
  },
  apiCommandTipLinkName: {
    rest: 'REST API',
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
    apiSamples: {
      tabTitle: '{*} API',
    },
  },
  hardlinkEntry: {
    pathLabel: 'Path',
    unknownPath: 'unknown',
  },
  apiEntry: {
    operation: 'Operation',
    command: 'Command',
    apiType: {
      rest: 'REST',
      xrootd: 'XRootD',
    },
  },
};
