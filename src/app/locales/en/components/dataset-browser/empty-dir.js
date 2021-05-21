import { capitalize } from '@ember/string';

const browse = 'browse';

export default {
  noChildren: 'No children datasets',
  noDatasets: 'No datasets',
  manageArchives: 'Manage archives',
  browse,
  browseUpper: capitalize(browse),
  or: 'or',
  rootDirectoryInBrowser: 'root directory of this dataset in file browser.',
  spaceRootInBrowser: 'space root directory in file browser.',
};
