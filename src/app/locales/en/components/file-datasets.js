import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import tabBar from './file-datasets/tab-bar';

export default {
  close: 'Close',
  // FIXME: i18n to discuss
  tabHints: {
    settings: 'There are some settings.',
    archives: {
      notEstablished: 'Not established, go away.',
      enabled: 'You will find archives here.',
    },
  },
  summaryHeader,
  directDatasetControl,
  tabBar,
};
