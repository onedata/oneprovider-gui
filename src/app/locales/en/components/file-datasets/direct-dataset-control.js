import { fileType } from '../dataset-protection/-common';

export default {
  fileType,
  markAsDataset: 'Mark this {{fileType}} as dataset',
  dataProtection: 'Data write protection',
  metadataProtection: 'Metadata write protection',
  establishingDataset: 'establishing dataset',
  cannotLoadDirectDataset: 'Could not load direct dataset state.',
  attachToggleTip: '<p>Toggle the attachment state of a dataset coupled with this {{fileType}}.</p><p><strong>Enabled</strong> state means that the {{fileType}} is treated as a dataset and offers some additional features (eg. write protection).</p> <p><strong>Disabling</strong> decouples the dataset from the {{fileType}} causing it to serve only for archival purposes.</p><p>If the {{fileType}} was never coupled with a dataset, enabling will establish a dataset for the {{fileType}}.</p>',
};
