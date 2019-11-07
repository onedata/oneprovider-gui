import { helper } from '@ember/component/helper';
import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';

export function transferTableRecord(params, hash) {
  return TransferTableRecord.create(hash);
}

export default helper(transferTableRecord);
