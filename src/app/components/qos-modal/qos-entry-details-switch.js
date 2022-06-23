/**
 * Button group for switching between detailed views of QoS requirement entry.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

/**
 * @typedef {'charts'|'logs'|null} QosEntryInfoType
 */

export default Component.extend(I18n, {
  classNames: ['qos-entry-details-switch'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntryDetailsSwitch',

  /**
   * @virtual
   * @type {QosEntryInfoType}
   */
  value: null,

  /**
   * @virtual
   * @type {(value: QosEntryInfoType) => void}
   */
  onChange: notImplementedThrow,

  actions: {
    change(value) {
      return this.get('onChange')(value);
    },
  },
});
