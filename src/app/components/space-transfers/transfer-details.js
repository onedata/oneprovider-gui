/**
 * Charts and details about transfer in transfers list
 * 
 * @module components/space-transfers/transfer-details
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads, equal } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['transfer-details'],

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.transferDetails',

  /**
   * @virtual
   * @type {Number}
   */
  columnsCount: undefined,

  /**
   * @virtual
   * @type {Utils.TransferTableRecord}
   */
  record: undefined,

  isViewTransfer: equal('record.transfer.dataSourceType', 'view'),

  transferQueryParams: reads('record.transfer.queryParams'),
});
