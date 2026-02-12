import browserColumns from './-browser-columns-name/filesystem';

const fileLinkAuthentication =
  'It only works for logged-in users that have access to this {{type}}. To obtain a public link, use the share function.';

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
  shareId: 'Share ID',
  shareIdTooltip: 'The identifier of the share containing this {{type}}. It\'s the same for all files and directories in this shared data collection. It can be used to interact with the share using different interfaces (e.g. REST API) and is used to build the share URL.',
  cdmiObjectId: 'File ID',
  cdmiObjectIdSubname: 'public',
  cdmiObjectIdTooltip: {
    priv: 'File ID is a unique, global identifier associated with this {{type}}. It can be used to access and interact with the {{type}} using different interfaces (e.g. REST API), but only by authorized users that have permission to do so.',
    public: 'Public File ID is a unique, global identifier associated with this shared {{type}}. As opposed to a non-public File ID, it grants public (unauthenticated) read-only access to the {{type}} using different interfaces (e.g. REST API).',
  },
  mtime: 'Modified',
  mtimeSubname: 'content',
  atime: 'Accessed',
  ctime: 'Changed',
  ctimeSubname: 'metadata',
  // TODO: VFS-12343 restore creationTime in GUI
  // creationTime: 'Created',
  tip: browserColumns.tip,
  owner: 'Owner',
  fileContent: 'Content',
  fileContentRow: {
    download: 'Download',
    replace: 'Replace...',
  },
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
