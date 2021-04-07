import {
  fileType,
  protectionType,
  headerData,
  headerMetadata,
}
from './file-datasets/-common';
import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import directDataset from './file-datasets/direct-dataset';
import ancestorDatasets from './file-datasets/ancestor-datasets';
import datasetItem from './file-datasets/dataset-item';

export default {
  fileType,
  protectionType,
  close: 'Close',
  tableHeaders: {
    data: headerData,
    metadata: headerMetadata,
  },
  cannotLoadFileDatasetSummary: 'Could not load dataset summary for selected element.',
  protectionHeaderHint: '{{protectionTypeUpper}} write protection can be individually set for each dataset in the hierarchy. The effective write protection of this {{fileType}} depends on all these settings – if any ancestor dataset has {{protectionType}} write protection enabled, then all nested content inherits the protection.',

  datasetItem,
  summaryHeader,
  ancestorDatasets,
  directDataset,
  directDatasetControl,
};
