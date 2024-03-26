import EmberObject, { computed } from '@ember/object';
import PropertyViewModel from './property-view-model';

const PropertyGroupViewModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.Edm.VisualEdmViewModel}
   */
  visualEdmViewModel: undefined,

  /**
   * @virtual
   * @type {Utils.Edm.ObjectViewModel}
   */
  objectViewModel: undefined,

  /**
   * @virtual
   * @type {Array<EdmProperty>}
   */
  edmProperties: undefined,

  propertiesViewModels: computed(
    'objectViewModel.validator.propertyValidators',
    'edmProperties',
    function propertiesViewModels() {
      return this.edmProperties.map(edmProperty => {
        const validator = this.objectViewModel.validator?.propertyValidators.find(v =>
          v.edmProperty === edmProperty
        );
        return PropertyViewModel.create({
          visualEdmViewModel: this.visualEdmViewModel,
          propertyGroupViewModel: this,
          validator,
          model: edmProperty,
        });
      });
    }
  ),

  /**
   *
   * @param {EdmProperty} edmProperty
   * @returns
   */
  findPropertyViewModel(edmProperty) {
    return this.propertiesViewModels.find(pvm => pvm.model.equals(edmProperty));
  },
});

export default PropertyGroupViewModel;
