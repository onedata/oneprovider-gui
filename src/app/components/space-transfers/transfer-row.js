import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';

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
   * @type {Array<Object>}
   */
  columns: undefined,

  /**
   * @virtual
   * @type {Models.Transfer}
   */
  transfer: undefined,

  /**
   * @virtual
   * @type {Array<Models.Transfer>}
   */
  transfers: undefined,

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * @type {String}
   */
  transferType: undefined,

  /**
   * @virtual
   * @type {String}
   */
  updaterId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {Array<Object>}
   */
  transferActions: undefined,

  dataRowId: reads('transfer.entityId'),

  record: computed(
    'transfer',
    'transfers',
    'providers',
    'transferType',
    'updaterId',
    'spaceId',
    function record() {
      const {
        transfer,
        transfers,
        providers,
        transferType: transferCollection,
        updaterId,
        spaceId,
      } = this.getProperties(
        'transfer',
        'transfers',
        'providers',
        'transferType',
        'updaterId',
        'spaceId',
      );
      return TransferTableRecord.create({
        transfer,
        transfers,
        providers,
        transferCollection,
        updaterId,
        spaceId,
      });
    }
  ),
});
