import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-recall-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveRecall.footer',

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
   * Parent directory for root recalled directory to be created.
   * @virtual
   * @type {Models.File}
   */
  parentDir: undefined,

  /**
   * Desired name of root recalled directory.
   * @virtual
   * @type {String}
   */
  targetDirName: '',

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
