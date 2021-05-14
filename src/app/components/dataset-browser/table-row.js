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
import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { or, raw } from 'ember-awesome-macros';

const RowModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Components.DatasetBrowser.TableRow}
   */
  tableRow: undefined,

  dataset: reads('tableRow.dataset'),
  archiveCount: or('dataset.archiveCount', raw(0)),
});

export default FbTableRow.extend({
  classNames: ['dataset-table-row'],

  /**
   * @type {Object}
   */
  file: undefined,

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

  /**
   * @type {ComputedProperty<BrowsableDataset>}
   */
  dataset: reads('file'),

  // TODO: VFS-7643 this will be probably injected from above
  fileRowModel: computed(function fileRowModel() {
    return RowModel.create({
      tableRow: this,
    });
  }),
});
