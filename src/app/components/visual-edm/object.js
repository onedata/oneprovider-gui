import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

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

  /**
   * @virtual
   * @type {EdmObject}
   */
  model: undefined,

  objectIcon: 'browser-metadata',

  /**
   * @type {Computed<Array<EdmProperty>>}
   */
  edmProperties: reads('model.edmProperties'),

  objectTypeName: computed('model.edmObjectType', function objectTypeName() {
    return this.t(`objectTypeName.${this.model.edmObjectType}`);
  }),

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
});
