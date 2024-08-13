/**
 * Provides EDM object model validation state according to recommendation of Eureka 3D.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { not, empty } from '@ember/object/computed';
import EdmPropertyValidator from './property-validator';
import EdmObjectType from './object-type';
import { EdmPropertyMaxOccurrences, EdmPropertyRecommendation, getAllPropertyData } from './property-spec';
import _ from 'lodash';
import { assert } from '@ember/debug';

let mandatoryPropertyTagsCache;

function getMandatoryPropertyTags() {
  return mandatoryPropertyTagsCache ??= createMandatoryPropertyTags();
}

let singlePropertiesMapCache;

function getSinglePropertiesMap() {
  return singlePropertiesMapCache ??= createSinglePropertyTags();
}

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

  isValid: empty('errors'),

  /**
   * @type {ComputedProperty<Array<EdmPropertyValidatorError|EdmObjectValidatorError>>}
   */
  errors: computed(
    'propertyValidators.@each.errors',
    function errors() {
      const result = [];
      const mandatoryProperties =
        getMandatoryPropertyTags()[this.edmObject.edmObjectType];
      const singleProperties = getSinglePropertiesMap()[this.edmObject.edmObjectType];
      const tagCountMapping = _.countBy(this.edmObject.edmProperties, 'xmlTagName');
      const missingProperties = mandatoryProperties.filter(xmlTag =>
        !tagCountMapping[xmlTag]
      );
      const exceedingProperties = singleProperties.filter(xmlTag =>
        tagCountMapping[xmlTag] > 1
      );
      if (missingProperties.length) {
        result.push(
          new EdmObjectMissingPropertiesError(this.edmObject, missingProperties)
        );
      }
      if (exceedingProperties.length) {
        result.push(new EdmObjectPropertiesMaxSingleError(
          this.edmObject, exceedingProperties
        ));
      }

      const propertiesErrors = _.flatten(this.propertyValidators.map(validator =>
        validator.errors
      ));

      const edmObjectType = this.edmObject.edmObjectType;
      for (const error of propertiesErrors) {
        error.edmObjectType = edmObjectType;
      }

      result.push(..._.flatten(this.propertyValidators.map(validator =>
        validator.errors
      )));

      return result;
    }
  ),

  isError: not('isValid'),

  init() {
    this._super(...arguments);
    assert(this.edmObject, 'edmObject must be provided for EdmObjectValidator');
    this.set('propertyValidatorsCache', new Map());
  },

  updateValue() {
    this.notifyPropertyChange('edmObject');
  },

  getPropertyValidators() {
    const resultValidators = this.edmObject.edmProperties.map(edmProperty => {
      let validator = this.propertyValidatorsCache.get(edmProperty);
      if (!validator) {
        validator = EdmPropertyValidator.create({ edmProperty });
        this.propertyValidatorsCache.get(edmProperty)?.destroy();
        this.propertyValidatorsCache.set(edmProperty, validator);
      }
      return validator;
    });
    for (const [edmProperty, validator] of this.propertyValidatorsCache.entries()) {
      if (!resultValidators.includes(validator)) {
        this.propertyValidatorsCache.get(edmProperty)?.destroy();
        this.propertyValidatorsCache.delete(edmProperty);
      }
    }
    return resultValidators;
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    for (const validator of this.propertyValidatorsCache.values()) {
      validator?.destroy();
    }
  },
});

/**
 * @returns {Object<string, Array<string>>}
 */
function createMandatoryPropertyTags() {
  const mandatoryPropertyTags = {};
  const allPropertyData = getAllPropertyData();

  for (const edmObjectType of Object.keys(EdmObjectType)) {
    mandatoryPropertyTags[edmObjectType] = allPropertyData.filter(propertySpec =>
      propertySpec.spec.obj.includes(edmObjectType) &&
      propertySpec.spec.rec === EdmPropertyRecommendation.Mandatory
    ).map(propertySpec => propertySpec.xmlTagName);
  }
  return mandatoryPropertyTags;
}

/**
 * @returns {Object<string, Array<string>>}
 */
function createSinglePropertyTags() {
  const singlePropertyTags = {};
  const allPropertyData = getAllPropertyData();
  for (const edmObjectType of Object.keys(EdmObjectType)) {
    singlePropertyTags[edmObjectType] = allPropertyData.filter(propertySpec =>
      propertySpec.spec.obj.includes(edmObjectType) &&
      (
        typeof propertySpec.spec.max === 'object' ?
        propertySpec.spec.max[edmObjectType] : propertySpec.spec.max
      ) === EdmPropertyMaxOccurrences.Single
    ).map(propertySpec => propertySpec.xmlTagName);
  }
  return singlePropertyTags;
}

export class EdmObjectMissingPropertiesError {
  /**
   * @param {EdmObject} edmObject
   * @param {string} propertyTags XML tag name of properties.
   */
  constructor(edmObject, propertyTags) {
    this.edmObject = edmObject;
    this.propertyTags = propertyTags;
  }
  toString() {
    return `missing ${this.edmObject.edmObjectType} object mandatory properties: ${this.propertyTags.join(', ')}`;
  }
}

export class EdmObjectPropertiesMaxSingleError {
  /**
   * @param {EdmObject} edmObject
   * @param {string} properties XML tag name of properties.
   */
  constructor(edmObject, properties) {
    this.edmObject = edmObject;
    this.properties = properties;
  }
  toString() {
    return `these properties can occur only once in object: ${this.properties.join(', ')}`;
  }
}

/**
 * @typedef {EdmObjectMissingPropertiesError|EdmObjectPropertiesMaxSingleError} EdmObjectValidatorError
 */

export default EdmObjectValidator;
