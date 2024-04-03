import Component from '@ember/component';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { exampleEdmEuropeanaXml } from 'oneprovider-gui/utils/mock-data';

export default Component.extend({
  init() {
    this._super(...arguments);
    // uncomment for initial metadata
    // const edmMetadata = EdmMetadataFactory.createInitialMetadata();
    const edmMetadata = EdmMetadataFactory.fromXml(exampleEdmEuropeanaXml);
    this.set('visualEdmViewModel', VisualEdmViewModel.create({
      ownerSource: this,
      edmMetadata,
      validator: EdmMetadataValidator.create({ edmMetadata }),
      isReadOnly: true,
    }));
  },

  actions: {
    generateXml() {
      console.log(this.visualEdmViewModel.edmMetadata.stringify());
    },
  },
});
