import providerRow from './size-stats-per-provider-table/provider-row';
import errorCell from './size-stats-per-provider-table/error-cell';

export default {
  containsLabel: 'Contains',
  containsTip: '',
  logicalSizeLabel: 'Logical size',
  logicalSizeTip: '',
  physicalSizeLabel: 'Physical size',
  elementsCount: {
    template: '{{fileCount}} {{fileNoun}}, {{dirCount}} {{dirNoun}}',
    templateExtraInfo: ' ({{totalCount}} {{elementNoun}} in total)',
    file: {
      singular: 'file',
      plural: 'files',
    },
    dir: {
      singular: 'directory',
      plural: 'directories',
    },
    element: {
      singular: 'element',
      plural: 'elements',
    },
  },
  providerRow,
  errorCell,
};
