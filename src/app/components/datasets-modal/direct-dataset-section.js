import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  classNames: ['direct-dataset-section'],

  i18nPrefix: 'components.datasetsModal.directDatasetSection',

  file: undefined,

  isDirectDataset: true,

  isDataProtected: false,

  isMetadataProtected: false,

  actions: {
    toggleDataset(enabled) {
      this.set('isDirectDataset', !this.get('isDirectDataset'));
      // this.get('datasetManager').toggleDataset(
      //   this.get('file'),
      //   enabled
      // );
    },
  },
});
