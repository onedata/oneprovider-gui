/**
 * Provides EDM metadata model validation state according to recommendation of Eureka 3D.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { not, empty } from '@ember/object/computed';
import EdmObjectValidator from './object-validator';
import { assert } from '@ember/debug';
import EdmObjectType from './object-type';
import _ from 'lodash';

const EdmMetadataValidator = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmMetadata}
   */
  edmMetadata: undefined,

  //#region state

  /**
   * @type {Map<EdmObject, EdmObjectValidator>}
   */
  objectValidatorsCache: undefined,

  //#endregion

  init() {
    this._super(...arguments);
    assert(this.edmMetadata, 'edmMetadata must be provided for EdmMetadataValidator');
    this.set('objectValidatorsCache', new Map());
  },

  /**
   * @type {Array<EdmPropertyValidator>}
   */
  objectValidators: computed('edmMetadata.edmObjects', function objectValidators() {
    return this.getObjectValidators();
  }),

  isValid: empty('errors'),

  isError: not('isValid'),

  updateValue() {
    this.notifyPropertyChange('edmMetadata');
  },

  errors: computed(
    'edmMetadata.edmObjects',
    'objectValidators.@each.isValid',
    function errors() {
      const result = [];
      const isSingleProvidedCHO = this.edmMetadata.edmObjects.filter(obj =>
        obj.edmObjectType === EdmObjectType.ProvidedCHO
      ).length === 1;
      if (!isSingleProvidedCHO) {
        result.push(
          new EdmMetadataInvalidObjectOcurrenceError(EdmObjectType.ProvidedCHO, 1)
        );
      }
      const isSingleAggregation = this.edmMetadata.edmObjects.filter(obj =>
        obj.edmObjectType === EdmObjectType.Aggregation
      ).length === 1;
      if (!isSingleAggregation) {
        result.push(
          new EdmMetadataInvalidObjectOcurrenceError(EdmObjectType.Aggregation, 1)
        );
      }
      result.push(..._.flatten(this.objectValidators.map(validator =>
        validator.errors
      )));
      return result;
    }
  ),

  getObjectValidators() {
    const resultValidators = this.edmMetadata.edmObjects.map(edmObject => {
      let validator = this.objectValidatorsCache.get(edmObject);
      if (!validator) {
        validator = EdmObjectValidator.create({ edmObject });
        this.objectValidatorsCache.get(edmObject)?.destroy();
        this.objectValidatorsCache.set(edmObject, validator);
      }
      return validator;
    });
    for (const [edmObject, validator] of this.objectValidatorsCache.entries()) {
      if (!resultValidators.includes(validator)) {
        this.objectValidatorsCache.get(edmObject)?.destroy();
        this.objectValidatorsCache.delete(edmObject);
      }
    }
    return resultValidators;
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    for (const validator of this.objectValidatorsCache.values()) {
      validator?.destroy();
    }
  },
});

export class EdmMetadataInvalidObjectOcurrenceError {
  constructor(edmObjectType, expectedOccurence) {
    this.edmObjectType = edmObjectType;
    this.expectedOccurence = expectedOccurence;
  }
  toString() {
    return `EDM object of type "${this.edmObjectType}" should occur exactly ${this.expectedOccurence} time(s)`;
  }
}

/**
 * @typedef {EdmMetadataInvalidObjectOcurrenceError} EdmMetadataValidatorError
 */

/**
 * @typedef {EdmMetadataValidatorError|EdmObjectValidatorError|EdmPropertyValidatorError} EdmValidatorError
 */

export default EdmMetadataValidator;
