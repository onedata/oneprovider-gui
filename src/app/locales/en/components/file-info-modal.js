const fileLinkAuthentication = 'Requires user authentication and the necccessary privileges';

export default {
  header: '{{type}} details',
  headerDefault: 'Details',
  name: '{{type}} name',
  path: '{{type}} location',
  storageLocations: 'Storage locations',
  showMore: 'Show more storage locations',
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
    show: {
      file: `<p><strong>Show item link</strong></p><p>The URL opens a file browser view with the file selected. ${fileLinkAuthentication} for the file.</p>`,
      dir: `<p><strong>Show item link</strong></p><p>The URL opens a file browser view with the directory selected. ${fileLinkAuthentication} for the directory.</p>`,
    },
    download: {
      file: `<p><strong>Download item link</strong></p><p>The URL opens a file browser view and asks for the file download. ${fileLinkAuthentication} for the file.</p><p>If you are looking for a URL to download the file without web browser usage, check out the API tab.</p>`,
      dir: `<p><strong>Download item link</strong></p><p>The URL opens a file browser view and asks for the directory and its contents download, packaged in the tar format. ${fileLinkAuthentication} for the directory.</p><p>If you are looking for a URL to download the directory without web browser usage, check out the API tab.</p>`,
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
