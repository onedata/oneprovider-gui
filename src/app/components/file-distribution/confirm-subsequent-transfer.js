/**
 * Asks for confirmation before starting new transfer when there are active
 * transfers in selected Oneprovider.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed, get } from '@ember/object';
import _ from 'lodash';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['confirm-subsequent-transfer'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistribution.confirmSubsequentTransfer',

  /**
   * One of: replication, migration, eviction
   * @virtual
   * @type {string}
   */
  transferType: undefined,

  /**
   * @virtual
   * @type {Models.Provider}
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

  /**
   * @type {Ember.ComputedProperty<SafeString>}
   */
  messageText: computed('transferType', 'oneprovider.name', function messageText() {
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
