import browserColumns from './-browser-columns-name/filesystem';

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
  mtime: 'Modified',
  mtimeSubname: 'content',
  atime: 'Accessed',
  ctime: 'Changed',
  ctimeSubname: 'metadata',
  // TODO: VFS-12343 restore creationTime in GUI
  // creationTime: 'Created',
  tip: browserColumns.tip,
  owner: 'Owner',
  size: 'Size',
  fileLink: {
    browser: 'Browser link',
    public: 'Public URL',
  },
  fileLinkLabel: {
    browser: {
      show: 'Show',
      download: 'Download',
    },
    public: {
      download: 'Download',
    },
  },
  fileLinkTip: {
    browser: {
      show: `This link opens the file browser and selects the {{type}}. ${fileLinkAuthentication}`,
      download: `This link opens the file browser and initiates a download of the {{type}}. ${fileLinkAuthentication}`,
    },
    public: {
      download: 'The direct URL to download the {{type}} without any authentication.',
    },
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
