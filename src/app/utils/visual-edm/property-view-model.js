import EmberObject from '@ember/object';

const PropertyViewModel = EmberObject.extend({
  visualEdmViewModel: undefined,
  edmObjectModel: undefined,
  model: undefined,

  // FIXME: redukcja powyższych na podstawie poniższego
  propertyGroupViewModel: undefined,

  updateView() {
    this.notifyPropertyChange('model');
  },
});

export default PropertyViewModel;
