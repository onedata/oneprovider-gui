import EmberObject, { computed } from '@ember/object';
import { not } from 'ember-awesome-macros';
import EdmPropertyValidator from './property-validator';
import EdmObjectType from './object-type';
import { EdmPropertyRecommendation, flatSpecs } from './property-spec';
import _ from 'lodash';
import { assert } from '@ember/debug';

export const mandatoryPropertiesMap = getMandatoryPropertyTags();

const EdmObjectValidator = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmObject}
   */
  edmObject: undefined,

  //#region state

  /**
   * @type {Map<EdmProperty, EdmPropertyValidator>}
   */
  propertyValidatorsCache: undefined,

  //#endregion

  /**
   * @virtual
   * @type {Array<EdmPropertyValidator>}
   */
  propertyValidators: computed('edmObject.edmProperties', function propertyValidators() {
    return this.getPropertyValidators();
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
      // TODO: VFS-11912 Check if any property does not exceeds max occurrences
    }
  ),

  isError: not('isValid'),

  init() {
    this._super(...arguments);
    assert(this.edmObject, 'edmObject must be provided for EdmObjectValidator');
    this.set('propertyValidatorsCache', new Map());
  },

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },

  getPropertyValidators() {
    const resultValidators = this.edmObject.edmProperties.map(edmProperty => {
      let validator = this.propertyValidatorsCache.get(edmProperty);
      if (!validator) {
        validator = EdmPropertyValidator.create({ edmProperty });
        this.propertyValidatorsCache.set(edmProperty, validator);
      }
      return validator;
    });
    for (const edmProperty of this.propertyValidatorsCache.keys()) {
      if (!resultValidators.includes(edmProperty)) {
        this.propertyValidatorsCache.delete(edmProperty);
      }
    }
    return resultValidators;
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
