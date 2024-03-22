import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['visual-edm-extra-data-info', 'edm-info-row', 'info'],

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.extraDataInfo',

  /**
   * @virtual
   * @type {EdmMetadata|EdmObject|EdmProperty}
   */
  model: undefined,
});
