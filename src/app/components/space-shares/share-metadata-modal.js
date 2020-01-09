import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  i18n: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.shareMetadataModal',

  /**
   * @virtual
   * @type {String}
   */
  metadataString: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  close: notImplementedIgnore,

  actions: {
    close() {
      return this.get('close')();
    },
  },
});
