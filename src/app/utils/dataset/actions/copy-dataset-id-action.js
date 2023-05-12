/**
 * Implementation of copy ID menu action for dataset.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseAction from './-base';
import { actionContext } from 'oneprovider-gui/components/file-browser';
import CopyRecordIdAction from 'onedata-gui-common/utils/clipboard-actions/copy-record-id-action';

export default BaseAction.extend({
  /**
   * @override
   */
  actionId: 'copyDatasetId',

  /**
   * @override
   */
  icon: 'circle-id',

  /**
   * @override
   */
  showIn: Object.freeze([
    actionContext.singleFile,
    actionContext.singleFilePreview,
    actionContext.singleDir,
    actionContext.singleDirPreview,
    actionContext.currentDir,
    actionContext.currentDirPreview,
  ]),

  /**
   * @override
   */
  onExecute(selectedItems) {
    const dataset = selectedItems[0];
    const copyRecordIdAction = CopyRecordIdAction.create({
      ownerSource: this,
      modelName: 'dataset',
      context: {
        record: dataset,
      },
    });
    return copyRecordIdAction.execute();
  },
});
