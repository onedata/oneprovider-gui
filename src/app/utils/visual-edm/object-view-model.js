import EmberObject, { computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import EdmPropertyFactory from '../edm/property-factory';
import { EdmPropertyMaxOccurrences } from '../edm/property-spec';
import EdmObjectValidator from '../edm/object-validator';

const ObjectViewModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.VisualEdmViewModel}
   */
  visualEdmViewModel: undefined,

  /**
   * @virtual
   * @type {EdmObject}
   */
  model: undefined,

  /**
   * @type {EdmObjectValidator}
   */
  objectValidator: undefined,

  edmProperties: reads('model.edmProperties'),

  edmObjectType: reads('model.edmObjectType'),

  /**
   * XML tags of poroperties that are defined in object and could have only single
   * instance.
   * @type {ComputedProperty<Array<string>>}
   */
  singleInstancePropertyTags: computed(
    'edmProperties',
    function singleDisabledItemsTags() {
      return this.edmProperties
        .filter(property => property.maxOccurrences === EdmPropertyMaxOccurrences.Single)
        .map(property => property.xmlTagName);
    }
  ),

  // FIXME:
  // edmPropertiesObserver: observer('edmProperties', function edmPropertiesObserver() {
  //   this.updateView();
  //   debugger;
  // }),

  updateView() {
    this.notifyPropertyChange('model');
    this.validator?.updateValue();
  },

  addProperty(item) {
    const factory = EdmPropertyFactory.create();
    this.model.edmProperties = [
      ...this.model.edmProperties,
      factory.createProperty(
        this.visualEdmViewModel.edmMetadata,
        item.namespace,
        item.name
      ),
    ];
    this.updateView();
  },

  deleteObject() {
    this.visualEdmViewModel.deleteObject(this.model);
  },
});

export default ObjectViewModel;
