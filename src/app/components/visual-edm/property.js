import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';

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
    return this.model.shownAttrs.map(name => ({
      name,
      value: attrs[name],
    })).filter(({ value }) => value);
  }),
});
