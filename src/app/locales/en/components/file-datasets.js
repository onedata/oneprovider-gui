import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import directDataset from './file-datasets/direct-dataset';
import ancestorDatasets from './file-datasets/ancestor-datasets';

const headerData = 'Data write&nbsp;protection';
const headerMetadata = 'Metadata write&nbsp;protection';

export default {
  close: 'Close',
  tableHeaders: {
    data: headerData,
    metadata: headerMetadata,
  },
  cannotLoadFileDatasetSummary: 'Could not load dataset summary for selected element.',
  protectionHeaderHint: {
    data: '[TODO: VFS-7479] (what is forbidden when data is write protected; how single dataset protection affects the final dataset)',
    metadata: '[TODO: VFS-7479] (what is forbidden when metadata is write protected; how single dataset protection affects the final dataset)',
  },

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
