import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed, get } from '@ember/object';
import _ from 'lodash';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, {
  classNames: ['confirm-subsequent-transfer'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.confirmSubsequentTransfer',

  /**
   * One of: replication, migration, eviction
   * @virtual
   * @type {string}
   */
  transferType: undefined,

  /**
   * @type {Models.Oneprovider}
   */
  oneprovider: undefined,

  /**
   * @type {Function}
   * @returns {undefined}
   */
  onCancel: notImplementedIgnore,

  /**
   * @type {Function}
   * @returns {Promise}
   */
  onConfirm: notImplementedReject,

  /**
   * @type {boolean}
   */
  canCancel: true,

  /**
   * @type {Ember.ComputedProperty<SafeString>}
   */
  confirmButtonText: computed('transferType', function confirmButtonText() {
    const transferType = this.get('transferType');
    return this.t(`start${_.upperFirst(transferType)}Button`);
  }),

  messageText: computed('transferType', 'oneprovider', function messageText() {
    const {
      transferType,
      oneprovider,
    } = this.getProperties('transferType', 'oneprovider');
    const oneproviderName = get(oneprovider, 'name');

    return this.t('messageText', {
      transferType: this.t(`transferTypes.${transferType}`),
      oneproviderName: oneproviderName,
    });
  }),

  actions: {
    confirm() {
      this.set('canCancel', false);
      return this.get('onConfirm')()
        .finally(() => safeExec(this, () => this.set('canCancel', true)));
    },
  },
});
