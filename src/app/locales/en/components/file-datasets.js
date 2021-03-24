import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import directDataset from './file-datasets/direct-dataset';
import ancestorDatasets from './file-datasets/ancestor-datasets';

export default {
  close: 'Close',
  tableHeaders: {
    data: 'Data write&nbsp;protection',
    metadata: 'Metadata write&nbsp;protection',
  },
  cannotLoadFileDatasetSummary: 'Could not load dataset summary for selected element.',
  protectionHeaderHint: {
    data: '[TODO: VFS-7479] (what is forbidden when data is write protected; how single dataset protection affects the final dataset)',
    metadata: '[TODO: VFS-7479] (what is forbidden when metadata is write protected; how single dataset protection affects the final dataset)',
  },

  summaryHeader,
  ancestorDatasets,
  directDataset,
  directDatasetControl,
};
