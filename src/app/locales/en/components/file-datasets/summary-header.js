import { fileType, protectionType } from '../dataset-protection/-common';

export default {
  fileType,
  dataset: 'dataset',
  protectionType,
  datasets: 'Datasets',
  hint: {
    title: 'Datasets',
    intro: 'Datasets allow the space users to organize their data into collections with desired granularity. A file or directory marked as a dataset offers additional features, such as optional data and metadata protection or the ability to create persistent snapshots of the physical dataset contents. In case of a directory, a dataset covers all its subdirectories and files. Datasets can be nested, allowing users to compose arbitrary hierarchical structures.',
    guide: 'This view presents a summary of datasets concerning the selected file/directory. It can be individually marked as a dataset with optional write protection settings, nevertheless all ancestor datasets (ones that contain the file/directory) are also considered when determining the effective write protection – presented in the top-right corner. This is depicted in the below table, which allows manipulating the settings for each dataset in the hierarchy.',
    close: 'OK',
  },
};
