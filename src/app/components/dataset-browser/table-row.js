/**
 * Implementation of table-row for dataset browser - represents a dataset established
 * on file or directory.
 *
 * @module components/dataset-browser/table-row
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRow from 'oneprovider-gui/components/file-browser/fb-table-row';
import { hash } from 'ember-awesome-macros';
import { computed } from '@ember/object';

export default FbTableRow.extend({
  classNames: ['dataset-table-row'],

  /**
   * @override
   */
  icon: computed('effFileType', function icon() {
    switch (this.get('effFileType')) {
      case 'dir':
        return 'browser-dataset';
      case 'file':
      default:
        return 'browser-dataset-file';
    }
  }),

  // TODO: VFS-7643 this will be probably injected from above
  fileRowModel: hash(),
});
