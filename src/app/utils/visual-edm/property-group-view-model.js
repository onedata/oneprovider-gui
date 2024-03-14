import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import PropertyViewModel from './property-view-model';

const PropertyGroupViewModel = EmberObject.extend({
  visualEdmViewModel: undefined,
  namespace: undefined,
  edmPropertyType: undefined,
  edmProperties: undefined,
  edmObjectModel: undefined,
  // FIXME: zredukować powyższe property wstrzykiwaane
  objectViewModel: undefined,

  edmObjectType: reads('edmObjectModel.edmObjectType'),

  propertiesViewModels: computed('edmProperties', function propertiesViewModels() {
    return this.edmProperties.map(edmProperty => PropertyViewModel.create({
      visualEdmViewModel: this.visualEdmViewModel,
      propertyGroupViewModel: this,
      model: edmProperty,
    }));
  }),
});

export default PropertyGroupViewModel;
