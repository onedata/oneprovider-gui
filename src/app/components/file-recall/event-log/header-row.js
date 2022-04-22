// FIXME: jsdoc

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall.eventLog.headerRow',
});
