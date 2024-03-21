import EmberObject, { computed } from '@ember/object';
import { not } from 'ember-awesome-macros';
import EdmObjectValidator from './object-validator';
import { assert } from '@ember/debug';
import EdmObjectType from './object-type';

const EdmMetadataValidator = EmberObject.extend({
  /**
   * @virtual
   */
  edmMetadata: undefined,

  init() {
    this._super(...arguments);
    assert(this.edmMetadata, 'edmMetadata must be provided for EdmMetadataValidator');
  },

  /**
   * @type {Array<EdmPropertyValidator>}
   */
  objectValidators: computed('edmMetadata.edmObjects', function objectValidators() {
    // FIXME: zrobić później cachowanie - dla odpowiedniego edmObject trzymać w cache utworzone walidatory
    return this.edmMetadata.edmObjects.map(object =>
      EdmObjectValidator.create({ edmObject: object })
    );
  }),

  // FIXME: rozdzielić computedy dla wydajności
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
    this.notifyPropertyChange('edmProperty');
  },
});

export default EdmMetadataValidator;
