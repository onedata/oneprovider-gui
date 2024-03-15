import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import EdmPropertyFactory from '../edm/property-factory';

const ObjectViewModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.VisualEdmViewModel}
   */
  visualEdmViewModel: undefined,

  /**
   * @virtual
   * @type {EdmObject}
   */
  model: undefined,

  edmProperties: reads('model.edmProperties'),

  updateView() {
    this.notifyPropertyChange('model');
  },

  addProperty(item) {
    const factory = EdmPropertyFactory.create();
    this.model.edmProperties = [
      ...this.model.edmProperties,
      factory.createProperty(
        this.visualEdmViewModel.edmMetadata,
        item.namespace,
        item.name
      ),
    ];
    this.updateView();
  },
});

export default ObjectViewModel;
