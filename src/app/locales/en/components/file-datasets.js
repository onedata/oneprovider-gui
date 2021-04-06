import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import directDataset from './file-datasets/direct-dataset';
import ancestorDatasets from './file-datasets/ancestor-datasets';

const headerData = 'Data write&nbsp;protection';
const headerMetadata = 'Metadata write&nbsp;protection';

export default {
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  protectionType: {
    data: 'data',
    metadata: 'metadata',
  },
  close: 'Close',
  tableHeaders: {
    data: headerData,
    metadata: headerMetadata,
  },
  cannotLoadFileDatasetSummary: 'Could not load dataset summary for selected element.',
  protectionHeaderHint: '{{protectionTypeUpper}} write protection can be individually set for each dataset in the hierarchy. The effective write protection of this {{fileType}} depends on all these settings – if any ancestor dataset has {{protectionType}} write protection enabled, then all nested content inherits the protection.',
  datasetItem: {
    toggleLabels: {
      data: headerData,
      metadata: headerMetadata,
    },
  },

  summaryHeader,
  ancestorDatasets,
  directDataset,
  directDatasetControl,
};
