import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import humanizeString from 'oneprovider-gui/utils/humanize-string';
import { and, eq, raw, not } from 'ember-awesome-macros';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import _ from 'lodash';
import PropertyGroupViewModel from 'oneprovider-gui/utils/visual-edm/property-group-view-model';
import { sortProperties } from 'oneprovider-gui/utils/edm/sort';

/**
 * @typedef {Object} EdmPropertyGroup
 * @property {EdmPropertyType} edmPropertyType
 * @property {string} namespace
 * @property {Array<EdmProperty>} edmProperties
 */

// FIXME: temp for design
const placeholders = {
  about: 'PID not provided',
};

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: [
    'visual-edm-object',
    // FIXME: styles mimic
    'edm-object-iconified-block',
    'modern-iconified-block',
    'iconified-block',
  ],
  classNameBindings: [
    'hasSomeProperties::has-no-properties',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.object',

  /**
   * @virtual
   * @type {Utils.VisualEdm.ObjectViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<Utils.VisualEdmViewModel>}
   */
  visualEdmViewModel: reads('viewModel.visualEdmViewModel'),

  objectIcon: 'browser-metadata',

  isAddPropertyOpened: false,

  hasSomeProperties: reads('edmProperties.length'),

  /**
   * @type {Computed<Array<EdmProperty>>}
   */
  edmProperties: reads('viewModel.edmProperties'),

  // FIXME: to może być w viewModel
  /**
   * @type {ComputedProperty<EdmPropertyGroup>}
   */
  edmPropertyGroups: computed('edmProperties', function edmPropertyGroups() {
    const sortedProperties = sortProperties(this.edmProperties);
    const groupedProperties = _.groupBy(sortedProperties, 'xmlTagName');
    return Object.values(groupedProperties).map(properties =>
      PropertyGroupViewModel.create({
        visualEdmViewModel: this.visualEdmViewModel,
        namespace: properties[0].namespace,
        // FIXME: to remove
        edmObjectModel: this.viewModel.model,
        objectViewModel: this.viewModel,
        edmPropertyType: properties[0].edmPropertyType,
        edmProperties: properties,
      })
    );
  }),

  isDeletable: and(
    eq('viewModel.model.edmObjectType', raw(EdmObjectType.WebResource)),
    not('visualEdmViewModel.isReadOnly'),
  ),

  objectTypeName: computed('model.edmObjectType', function objectTypeName() {
    return this.t(`objectTypeName.${this.viewModel.model.edmObjectType}`);
  }),

  attrItems: computed(
    'viewModel.model.{shownAttrs,attrs}',
    'visualEdmViewModel.isReadOnly',
    function attrItems() {
      // FIXME: dummy
      if (!this.visualEdmViewModel.isReadOnly) {
        return [];
      }
      const attrs = this.viewModel.model.attrs;
      const result = this.viewModel.model.shownAttrs.map(name => {
        const foundTranslation = this.t(
          `attrName.${name}`, {}, {
            defaultValue: null,
          }
        );
        return {
          name: foundTranslation || humanizeString(name),
          placeholder: placeholders[name],
          value: attrs[name],
        };
      });
      // FIXME: jeśli jest readonly i puste wartości, to powinny być jakieś placeholdery
      return result;
    }
  ),

  addPropertyButtonSelector: computed('elementId', function addPropertyButtonSelector() {
    return `#${this.elementId} .add-edm-property-btn`;
  }),

  deleteObjectTip: computed('viewModel.model.edmObjectType', function deleteObjectTip() {
    const objectType = this.viewModel.model.edmObjectType;
    return this.t('deleteObjectTip', {
      objectType: this.t(
        `objectTypeName.${objectType}`, {}, { defaultValue: this.t('object') }
      ),
    });
  }),

  init() {
    this._super(...arguments);
    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_object');
  },

  closeAddProperty() {
    this.set('isAddPropertyOpened', false);
  },

  actions: {
    toggleAddPropertyOpen(open) {
      this.set(
        'isAddPropertyOpened',
        typeof open === 'boolean' ? open : !this.isAddPropertyOpened
      );
    },
    /**
     * @param {VisualEdm.AddPropertySelectorSpec} item
     */
    addProperty(item) {
      // FIXME: implement
      this.viewModel.addProperty(item);
      this.closeAddProperty();
    },
    cancelPropertySelect() {
      this.closeAddProperty();
    },
    deleteObject() {
      this.viewModel.deleteObject();
    },
  },
});
