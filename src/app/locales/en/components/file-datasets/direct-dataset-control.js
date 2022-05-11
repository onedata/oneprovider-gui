import { fileType } from '../dataset-protection/-common';

export default {
  fileType,
  cannotLoadDirectDataset: 'Could not load direct dataset state.',
  establishDatasetHere: 'Establish dataset',
  actionsButton: 'Actions',
  statusText: {
    notEstablished: 'No dataset has been established on this {{fileType}}.',
    attached: 'This {{fileType}} is a dataset (established at {{creationTime}}).',
    detached: 'This {{fileType}} has been <strong>detached</strong> from its dataset (established at {{creationTime}}).',
  },
  statusTip: {
    detached: '<p>The dataset is decoupled from this {{fileType}} and serves only archival purposes – to keep track of the archives that were created during its <strong>attached</strong> lifecycle.</p><p>The dataset does not correspond to any physical content in the file tree and changes to the original root {{fileType}} contents are not reflected in the dataset.</p>',
  },
};
