import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-settings-submit-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings.submitFooter',

  i18n: service(),

  // FIXME: virtuals
  disabled: undefined,
  onSubmit: notImplementedReject,
  onClose: notImplementedIgnore,

  actions: {
    submit() {
      this.get('onSubmit')();
    },
    close() {
      this.get('onClose')();
    },
  },
});
