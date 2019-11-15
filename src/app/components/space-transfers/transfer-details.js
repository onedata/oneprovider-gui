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
