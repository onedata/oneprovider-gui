import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import EdmPropertyFactory from '../edm/property-factory';
import { EdmPropertyMaxOccurrences } from '../edm/property-spec';
import { sortProperties } from 'oneprovider-gui/utils/edm/sort';
import PropertyGroupViewModel from './property-group-view-model';
import _ from 'lodash';

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

  /**
   * @type {ComputedProperty<EdmPropertyGroup>}
   */
  edmPropertyGroups: computed('edmProperties', function edmPropertyGroups() {
    const sortedProperties = sortProperties(this.edmProperties, 'visual');
    const groupedProperties = _.groupBy(sortedProperties, 'xmlTagName');
    return Object.values(groupedProperties).map(edmProperties =>
      PropertyGroupViewModel.create({
        visualEdmViewModel: this.visualEdmViewModel,
        edmProperties,
        objectViewModel: this,
      })
    );
  }),

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
    const newEdmProperty = factory.createProperty(
      this.visualEdmViewModel.edmMetadata,
      item.namespace,
      item.name
    );
    // FIXME: należy wstawić do tablicy w kolejności sortowania
    this.model.edmProperties = [
      ...this.model.edmProperties,
      newEdmProperty,
    ];
    this.updateView();
    const pvm = this.findPropertyViewModel(newEdmProperty);
    pvm.animateAttention();
  },

  deleteObject() {
    this.visualEdmViewModel.deleteObject(this.model);
  },

  findPropertyViewModel(edmProperty) {
    for (const group of this.edmPropertyGroups) {
      const pvm = group.findPropertyViewModel(edmProperty);
      if (pvm) {
        return pvm;
      }
    }
  },
});

export default ObjectViewModel;
