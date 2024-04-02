import Component from '@ember/component';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { exampleEdmEuropeanaXml } from 'oneprovider-gui/utils/mock-data';

export default Component.extend({
  init() {
    this._super(...arguments);
    const factory = EdmMetadataFactory.create();
    // uncomment for initial metadata
    // const edmMetadata = factory.createInitialMetadata();
    const edmMetadata = factory.fromXml(exampleEdmEuropeanaXml);
    this.set('visualEdmViewModel', VisualEdmViewModel.create({
      ownerSource: this,
      edmMetadata,
      validator: EdmMetadataValidator.create({ edmMetadata }),
      isReadOnly: false,
    }));
  },

  actions: {
    generateXml() {
      console.log(this.visualEdmViewModel.edmMetadata.stringify());
    },
  },
});
