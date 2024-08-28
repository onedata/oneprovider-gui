/**
 * Model for `VisualEdm::Object` component associated with `EdmObject` model.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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

  //#region state

  /**
   * @type {EdmObjectValidator}
   */
  validator: undefined,

  /**
   * @type {ComputedProperty<EdmPropertyGroup>}
   */
  prevEdmPropertyGroups: undefined,

  //#endregion

  edmProperties: reads('model.edmProperties'),

  edmObjectType: reads('model.edmObjectType'),

  isDisabled: reads('visualEdmViewModel.isDisabled'),

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.destroyPrevEdmPropertyGroups();
  },

  /**
   * XML tags of properties that are defined in object and could have only single
   * instance.
   * @type {ComputedProperty<Array<string>>}
   */
  singleInstancePropertyTags: computed(
    'edmProperties',
    function singleInstancePropertyTags() {
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
    const newGroups = Object.values(groupedProperties).map(edmProperties =>
      PropertyGroupViewModel.create({
        visualEdmViewModel: this.visualEdmViewModel,
        edmProperties,
        objectViewModel: this,
      })
    );
    this.destroyPrevEdmPropertyGroups();
    this.set('prevEdmPropertyGroups', newGroups);
    return newGroups;
  }),

  updateView() {
    this.notifyPropertyChange('model');
    this.validator?.updateValue();
  },

  addProperty(item) {
    if (this.isDisabled) {
      return;
    }
    const factory = new EdmPropertyFactory(
      this.visualEdmViewModel.edmMetadata,
      this.edmObjectType
    );
    factory.shareRootFile = this.visualEdmViewModel.shareRootFile;
    const newEdmProperty = factory.createProperty(
      item.namespace,
      item.name
    );
    this.model.addProperty(newEdmProperty);
    this.visualEdmViewModel.markAsModified();
    this.updateView();
    const pvm = this.findPropertyViewModel(newEdmProperty);
    pvm.animateAttention();
  },

  deleteObject() {
    if (this.isDisabled) {
      return;
    }
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

  destroyPrevEdmPropertyGroups() {
    if (!this.prevEdmPropertyGroups) {
      return;
    }
    for (const propertyGroupViewModel of this.prevEdmPropertyGroups) {
      try {
        propertyGroupViewModel?.destroy();
      } catch {
        // ignore
      }
    }
  },
});

export default ObjectViewModel;
