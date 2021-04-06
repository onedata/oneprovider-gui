import { fileType, protectionType } from '../file-datasets/-common';

export default {
  fileType,
  protectionType,
  summaryAncestorsReadonlyFlags: 'Effective {{protectionType}} protection stemming from protection settings of each ancestor dataset in the hierarchy. Expand this row to view and toggle {{protectionType}} protection for respective ancestor datasets.',
  ancestorDatasetsTip: 'Expand to view the list of ancestor datasets and toggle their data and metadata protection settings.',
  ancestorDatasets: 'Ancestor datasets',
  cannotLoadAncestorDatasets: 'Could not load ancestor datasets list.',
  noAncestorDatasets: 'This file does not have any ancestor datasets.',
  noAncestorDatasetsTip: 'The selected {{fileType}} is not contained in any ancestor dataset (none of the ancestor directories is a dataset in attached state).',
};
