import {
  fileType,
  protectionType,
  headerData,
  headerMetadata,
} from './-common';

export default {
  fileType,
  protectionType,
  cannotLoadFileDatasetSummary: 'Could not load dataset summary for selected element.',
  protectionHeaderHint: '{{protectionTypeUpper}} write protection can be individually set for each dataset in the hierarchy. The effective write protection of this {{fileType}} depends on all these settings – if any ancestor dataset has {{protectionType}} write protection enabled, then all nested content inherits the protection.',
  tableHeaders: {
    data: headerData,
    metadata: headerMetadata,
  },
};
