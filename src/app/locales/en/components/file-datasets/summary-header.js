import { fileType, protectionType } from '../dataset-protection/-common';

export default {
  fileType,
  dataset: 'dataset',
  protectionType,
  datasets: 'Datasets',
  hint: {
    title: 'Datasets',
    intro: 'Datasets are essentially files or directories that have been marked by space users as representing data collections relevant for them. This is achieved by <strong>establishing</strong> a dataset on a file or directory, which does not modify the file/directory structure or content, but simply assigns a dataset status to it. In the case of a directory, a dataset covers all its subdirectories and files. Datasets offer additional features, such as optional data and metadata protection and dataset structure tracking using the dataset browser. It is also possible to create persistent snapshots of the physical dataset contents (called <em>archives</em>). Datasets can be nested, allowing users to compose arbitrary hierarchical structures.',
    guide: 'This view presents a summary of datasets concerning the selected {{fileType}}.',
    settingsTab: 'The <strong>settings</strong> tab is used to manage the dataset aspects of the current {{fileType}} and all its ancestor datasets.',
    archivesTab: 'The <strong>archives</strong> tab contains a browser of archives created for the dataset associated with the current {{fileType}} with basic archive management utilities.',
    close: 'OK',
  },
};
