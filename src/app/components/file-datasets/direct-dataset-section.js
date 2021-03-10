import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['direct-dataset-section'],

  i18nPrefix: 'components.fileDatasets.directDatasetSection',

  file: undefined,

  isDirectDataset: true,

  isDataProtected: false,

  isMetadataProtected: false,

  actions: {
    toggleDataset() {
      this.set('isDirectDataset', !this.get('isDirectDataset'));
    },
  },
});
