import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-settings-header'],

  i18nPrefix: 'components.archiveSettings.header',

  /**
   * @virtual
   */
  dataset: undefined,
});
