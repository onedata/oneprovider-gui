import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

/**
 * @type {EdmPropertyValueType.Literal|EdmPropertyValueType.Reference} VisualEdmPropertyValueType
 */

export default Component.extend(I18n, {
  classNames: ['visual-edm-image-reference'],

  i18nPrefix: 'components.visualEdm.imageReference',

  /**
   * @virtual
   * @type {string}
   */
  reference: undefined,

  /**
   * @type {Event}
   */
  loadError: null,

  actions: {
    handleImageLoaded() {
      this.set('loadError', null);
    },
    handleImageLoadError(error) {
      this.set('loadError', error);
    },
  },
});
