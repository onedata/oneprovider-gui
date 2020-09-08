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
import { equal } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: 'tr',
  classNames: [
    'transfer-row',
    'transfers-table-row',
    'data-row',
  ],
  attributeBindings: ['dataRowId:data-row-id'],

  currentUser: service(),

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

  /**
   * True if this transfer was created by current (session) user
   * @type {ComputedProperty<Boolean>}
   */
  ownedByCurrentUser: equal('currentUser.userId', 'record.transfer.userId'),

  dataRowId: reads('transfer.entityId'),

  actions: {
    openDbViewModal() {
      return this.get('openDbViewModal')(...arguments);
    },
  },
});
