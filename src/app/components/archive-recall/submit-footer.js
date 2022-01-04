import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-recall-submit-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveRecall.submitFooter',

  i18n: service(),

  /**
   * @virtual
   * @type {Function}
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  onSubmit: notImplementedReject,

  /**
   * @virtual
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @virtual
   * @type {Boolean}
   */
  disabled: false,
});
