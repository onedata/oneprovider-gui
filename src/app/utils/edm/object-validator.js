import EmberObject, { computed } from '@ember/object';
import { not } from 'ember-awesome-macros';
import EdmPropertyValidator from './property-validator';
import EdmObjectType from './object-type';
import { EdmPropertyRecommendation, flatSpecs } from './property-spec';
import _ from 'lodash';

const mandatoryPropertiesMap = getMandatoryPropertyTags();

const EdmObjectValidator = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmObject}
   */
  edmObject: undefined,

  /**
   * @virtual
   * @type {Array<EdmPropertyValidator>}
   */
  propertyValidators: computed('edmObject.edmProperties', function propertyValidators() {
    // FIXME: zrobić później cachowanie - dla odpowiedniego edmObject trzymać w cache utworzone walidatory
    return this.edmObject.edmProperties.map(property =>
      EdmPropertyValidator.create({ edmProperty: property })
    );
  }),

  isValid: computed(
    'propertyValidators.@each.isValid',
    function isValid() {
      const missingProperties = _.difference(
        mandatoryPropertiesMap[this.edmObject.edmObjectType],
        this.edmObject.edmProperties.map(p => p.xmlTagName)
      );
      if (missingProperties.length) {
        return false;
      }
      return this.propertyValidators.every(validator =>
        validator.isValid
      );
      // FIXME: sprawdzenie, czy nic nie przekracza max occurences
    }
  ),

  isError: not('isValid'),

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },
});

function getMandatoryPropertyTags() {
  const mandatoryPropertyTags = {};
  for (const edmObjectType of Object.keys(EdmObjectType)) {
    mandatoryPropertyTags[edmObjectType] = flatSpecs.filter(propertySpec =>
      propertySpec.spec.obj.includes(edmObjectType) &&
      propertySpec.spec.rec === EdmPropertyRecommendation.Mandatory
    ).map(propertySpec => propertySpec.xmlTagName);
  }
  return mandatoryPropertyTags;
}

export default EdmObjectValidator;
