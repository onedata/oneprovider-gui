/**
 * Model and logic for file-shares components
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
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

  /**
   * @override
   */
  i18nPrefix: 'utils.fileSharesViewModel',

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

  sharesProxy: reads('file.shareRecords'),

  shares: reads('sharesProxy.content'),

  getShareUrl({ shareId }) {
    return this.appProxy.callParent('getShareUrl', { shareId });
  },
});
