import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';

export default Component.extend(I18n, {
  classNames: ['fb-table'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTable',

  dir: undefined,

  filesArray: computed('dir.children', function filesArray() {

  }),
});
