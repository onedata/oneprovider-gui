/**
 * Model for `VisualEdm::PropertyGroup` component associated with array of `EdmProperty`
 * model instances with the same `edmPropertyType`.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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

  //#region state

  prevPropertiesViewModels: undefined,

  //#endregion

  /**
   * @type {ComputedProperty<Array<PropertyViewModel>>}
   */
  propertiesViewModels: computed(
    'objectViewModel.validator.propertyValidators',
    'edmProperties',
    function propertiesViewModels() {
      const newProperties = this.edmProperties.map(edmProperty => {
        const validator = this.objectViewModel.validator?.propertyValidators.find(v =>
          v.edmProperty === edmProperty
        );
        return PropertyViewModel.create({
          propertyGroupViewModel: this,
          validator,
          model: edmProperty,
        });
      });
      this.destroyPrevPropertiesViewModels();
      this.set('prevPropertiesViewModels', newProperties);
      return newProperties;
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

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.destroyPrevPropertiesViewModels();
  },

  destroyPrevPropertiesViewModels() {
    if (!this.prevPropertiesViewModels) {
      return;
    }
    for (const propertyViewModel of this.prevPropertiesViewModels) {
      try {
        propertyViewModel?.destroy();
      } catch {
        // ignore
      }
    }
  },
});

export default PropertyGroupViewModel;
