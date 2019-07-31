import Component from '@ember/component';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal',

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onClose: notImplementedIgnore,

  actions: {
    close() {
      this.get('onClose')();
    },
  },
});
