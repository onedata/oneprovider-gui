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
import { or, raw, conditional } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const RowModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Components.DatasetBrowser.TableRow}
   */
  tableRow: undefined,

  dataset: reads('tableRow.dataset'),
  rootFileDeleted: reads('dataset.rootFileDeleted'),
  rootFileType: reads('dataset.rootFileType'),
  archiveCount: or('dataset.archiveCount', raw(0)),
});

export default FbTableRow.extend(I18n, {
  classNames: ['dataset-table-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableRow',

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
   * @override
   */
  iconTag: reads('iconConfig.iconTag'),

  /**
   * @override
   */
  iconTaggedClass: reads('iconConfig.iconTaggedClass'),

  /**
   * @override
   */
  iconTip: reads('iconConfig.iconTip'),

  /**
   * @type {ComputedProperty<Object>}
   */
  iconConfig: conditional(
    'fileRowModel.rootFileDeleted',
    computed('rootFileType', function iconConfig() {
      const fileType = this.get('fileRowModel.rootFileType');
      return {
        iconTag: 'x',
        iconTaggedClass: 'warning',
        iconTip: this.t('rootFileDeletedTip', {
          fileType: this.t(`fileType.${fileType}`, {}, {
            defaultValue: this.t('fileType.file'),
          }),
        }),
      };
    }),
    raw(null)
  ),

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
