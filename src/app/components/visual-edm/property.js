import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

export default Component.extend(I18n, {
  classNames: ['visual-edm-property', 'edm-property-box'],

  i18nPrefix: 'components.visualEdm.property',

  /**
   * @virtual
   * @type {EdmProperty}
   */
  model: undefined,

  attrItems: computed('model.{shownAttrs,attrs}', function attrItems() {
    const attrs = this.model.attrs;
    return this.model.shownAttrs.map(name => {
      const foundTranslation = this.t(
        `attrName.${name}`, {}, {
          defaultValue: null,
        }
      );
      return {
        name: foundTranslation || humanizeString(name),
        value: attrs[name],
      };
    }).filter(({ value }) => value);
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'model.{namespace,edmPropertyType}',
    function displayedPropertyName() {
      const foundTranslation = this.t(
        `propertyName.${this.model.namespace}.${this.model.edmPropertyType}`, {}, {
          defaultValue: null,
        }
      );
      return foundTranslation || htmlSafe(humanizeString(this.model.edmPropertyType));
    }
  ),
});
