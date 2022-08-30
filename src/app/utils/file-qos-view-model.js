/**
 * Model and logic for file-qos components
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const mixins = [
  OwnerInjector,
  I18n,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  shareManager: service(),
  globalNotify: service(),
  appProxy: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileQosViewModel',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,
});
