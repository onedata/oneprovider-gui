/**
 * Row in the transfers table
 * 
 * @module components/space-transfers/transfer-row
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend({
  tagName: 'tr',
  classNames: [
    'transfer-row',
    'transfers-table-row',
    'data-row',
  ],
  attributeBindings: ['dataRowId:data-row-id'],

  /**
   * @virtual
   * @type {TransferTableRecord}
   */
  record: undefined,

  /**
   * @virtual
   * @type {Array<Object>}
   */
  columns: undefined,

  /**
   * @virtual
   * @type {Array<Object>}
   */
  transferActions: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  openDbViewModal: notImplementedThrow,

  dataRowId: reads('transfer.entityId'),

  actions: {
    openDbViewModal() {
      return this.get('openDbViewModal')(...arguments);
    },
  },
});