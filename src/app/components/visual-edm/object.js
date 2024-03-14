import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import humanizeString from 'oneprovider-gui/utils/humanize-string';
import { and, eq, raw, not } from 'ember-awesome-macros';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import _ from 'lodash';

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
   * @type {Utils.VisualEdmViewModel}
   */
  viewModel: undefined,

  /**
   * @virtual
   * @type {EdmObject}
   */
  model: undefined,

  objectIcon: 'browser-metadata',

  isAddPropertyOpened: false,

  hasSomeProperties: reads('edmProperties.length'),

  /**
   * @type {Computed<Array<EdmProperty>>}
   */
  edmProperties: reads('model.edmProperties'),

  /**
   * @type {ComputedProperty<EdmPropertyGroup>}
   */
  edmPropertyGroups: computed('edmProperties', function edmPropertyGroups() {
    const sortedProperties = _.sortBy(this.edmProperties, ['xmlTagName']);
    const groupedProperties = _.groupBy(sortedProperties, 'xmlTagName');
    return Object.values(groupedProperties).map(properties => ({
      namespace: properties[0].namespace,
      edmPropertyType: properties[0].edmPropertyType,
      edmProperties: properties,
    }));
  }),

  isDeletable: and(
    eq('model.edmObjectType', raw(EdmObjectType.WebResource)),
    not('viewModel.isReadOnly'),
  ),

  objectTypeName: computed('model.edmObjectType', function objectTypeName() {
    return this.t(`objectTypeName.${this.model.edmObjectType}`);
  }),

  attrItems: computed(
    'model.{shownAttrs,attrs}',
    'viewModel.isReadOnly',
    function attrItems() {
      // FIXME: dummy
      if (!this.viewModel.isReadOnly) {
        return [];
      }
      const attrs = this.model.attrs;
      const result = this.model.shownAttrs.map(name => {
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

  init() {
    this._super(...arguments);
    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_object');
  },

  updateView() {
    this.notifyPropertyChange('model');
  },

  actions: {
    toggleAddPropertyOpen(open) {
      this.set(
        'isAddPropertyOpened',
        typeof open === 'boolean' ? open : !this.isAddPropertyOpened
      );
    },
    onPropertyAdd( /*propertySpec*/ ) {
      // FIXME: implement
      this.set('isAddPropertyOpened', false);
    },
  },
});
