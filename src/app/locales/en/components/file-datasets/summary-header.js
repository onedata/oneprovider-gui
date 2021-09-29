import { fileType, protectionType } from '../dataset-protection/-common';

export default {
  fileType,
  dataset: 'dataset',
  protectionType,
  datasets: 'Datasets',
  hint: {
    title: 'Datasets',
    intro: 'Datasets allow the space users to organize their data into collections with desired granularity. A file or directory marked as a dataset offers additional features, such as optional data and metadata protection or the ability to create persistent snapshots of the physical dataset contents (called <em>archives</em>). In the case of a directory, a dataset covers all its subdirectories and files. Datasets can be nested, allowing users to compose arbitrary hierarchical structures.',
    guide: 'This view presents a summary of datasets concerning the selected {{fileType}}.',
    settingsTab: 'The <strong>settings</strong> tab is used to manage the dataset aspects of the current {{fileType}} and all its ancestor datasets.',
    archivesTab: 'The <strong>archives</strong> tab contains a browser of archives created for the dataset associated with the current {{fileType}} with basic archive management utilities.',
    close: 'OK',
  },
};
