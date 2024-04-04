/**
 * Provides EDM metadata model validation state according to recommendation of Eureka 3D.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { not } from 'ember-awesome-macros';
import EdmObjectValidator from './object-validator';
import { assert } from '@ember/debug';
import EdmObjectType from './object-type';

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

  isValid: computed(
    'edmMetadata.edmObjects',
    'objectValidators.@each.isValid',
    function isValid() {
      const validObjectsOccurrence =
        this.edmMetadata.edmObjects.filter(obj =>
          obj.edmObjectType === EdmObjectType.ProvidedCHO
        ).length === 1 &&
        this.edmMetadata.edmObjects.filter(obj =>
          obj.edmObjectType === EdmObjectType.Aggregation
        ).length === 1;
      if (!validObjectsOccurrence) {
        return false;
      }
      return this.objectValidators.every(objectValidator =>
        objectValidator.isValid
      );
    }
  ),

  isError: not('isValid'),

  updateValue() {
    this.notifyPropertyChange('edmMetadata');
  },

  getObjectValidators() {
    const resultValidators = this.edmMetadata.edmObjects.map(edmObject => {
      let validator = this.objectValidatorsCache.get(edmObject);
      if (!validator) {
        validator = EdmObjectValidator.create({ edmObject });
        this.objectValidatorsCache.set(edmObject, validator);
      }
      return validator;
    });
    for (const edmObject of this.objectValidatorsCache.keys()) {
      if (!resultValidators.includes(edmObject)) {
        this.objectValidatorsCache.delete(edmObject);
      }
    }
    return resultValidators;
  },
});

export default EdmMetadataValidator;
