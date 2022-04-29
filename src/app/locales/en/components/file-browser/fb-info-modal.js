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
      tabTitle: 'API',
    },
  },
  hardlinkEntry: {
    pathLabel: 'Path',
    unknownPath: 'unknown',
  },
};
