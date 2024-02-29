import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: [
    'visual-edm-object',
    // FIXME: styles mimic
    'edm-object-iconified-block',
    'modern-iconified-block',
    'iconified-block',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.object',

  model: undefined,

  /**
   * @type {Array<Utils.Edm.EdmProperty>}
   */
  edmProperties: undefined,

  objectTypeName: computed('model.edmObjectType', function objectTypeName() {
    return this.t(`objectTypeName.${this.model.edmObjectType}`);
  }),

  init() {
    this._super(...arguments);
    if (!Array.isArray(this.edmProperties)) {
      this.set('edmProperties', []);
    }
  },
});
