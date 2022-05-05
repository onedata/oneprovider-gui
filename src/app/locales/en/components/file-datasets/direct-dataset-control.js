import { fileType } from '../dataset-protection/-common';

const establishedTextCommon = 'Dataset has been established on this {{fileType}} at {{creationTime}}';

export default {
  fileType,
  cannotLoadDirectDataset: 'Could not load direct dataset state.',
  establishDatasetHere: 'Establish dataset here',
  actionsButton: 'Actions',
  statusText: {
    notEstablished: 'This {{fileType}} has no direct dataset established.',
    attached: `${establishedTextCommon}.`,
    detached: `${establishedTextCommon}, but currently is detached.`,
  },
  // FIXME: use, text
  statusTip: {
    notEstablished: '',
    attached: '',
    detached: '',
  },
};
