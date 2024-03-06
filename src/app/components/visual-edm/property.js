import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['visual-edm-property', 'edm-property-box'],

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
