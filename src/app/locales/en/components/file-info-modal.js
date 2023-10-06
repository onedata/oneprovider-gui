const fileLinkAuthentication =
  'It only works for logged-in users that have access to this {{type}}. To obtain a public link, use the Share function.';

export default {
  header: '{{type}} details',
  headerDefault: 'Details',
  name: '{{type}} name',
  path: '{{type}} location',
  storageLocations: 'Physical locations',
  storageLocationsTooltip: 'Locations on particular storage backends where the data is stored.',
  showMore: 'Show more physical locations',
  symlinkTargetPath: 'Symbolic link target path',
  unknownSpaceInSymlink: 'unknown space',
  spaceId: 'Space ID',
  cdmiObjectId: 'File ID',
  modificationTime: 'Modified at',
  owner: 'Owner',
  size: 'Size',
  fileLink: '{{type}} link',
  fileLinkLabel: {
    show: 'Show',
    download: 'Download',
  },
  fileLinkTip: {
    show: `This link opens the file browser and selects the {{type}}. ${fileLinkAuthentication}`,
    download: `This link opens the file browser and initiates a download of the {{type}}. ${fileLinkAuthentication}`,
  },
  fileType: {
    file: 'file',
    dir: 'directory',
    symlink: 'symbolic link',
  },
  tabs: {
    general: {
      tabTitle: 'Info',
    },
    size: {
      tabTitle: 'Size stats',
    },
    hardlinks: {
      tabTitle: 'Hard links',
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
