/**
 * Implementation of table row for filesystem-browser. Represents single file, directory
 * or symlink.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import FbTableRow from 'oneprovider-gui/components/file-browser/fb-table-row';
import { equal, raw, conditional, isEmpty } from 'ember-awesome-macros';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';
import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

const RowModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Components.FilesystemBrowser.TableRow}
   */
  tableRow: undefined,

  isSymlink: reads('tableRow.isSymlink'),
});

export default FbTableRow.extend({
  classNames: ['filesystem-table-row'],

  // TODO: VFS-7643 add a table-row model

  /**
   * @override
   * @type {ComputedProperty<Boolean>}
   */
  fileCut: equal('fileClipboardMode', raw('move')),

  /**
   * @override
   */
  icon: computed('effFileType', function icon() {
    switch (this.get('effFileType')) {
      case 'dir':
        return 'browser-directory';
      case 'file':
      default:
        return 'browser-file';
    }
  }),

  /**
   * @override
   */
  hasErrorIconTag: isEmpty('effFileType'),

  /**
   * @override
   */
  iconTag: conditional(
    'hasErrorIconTag',
    raw('x'),
    conditional(
      'isSymlink',
      raw('shortcut'),
      raw(null)
    )
  ),

  /**
   * @override
   */
  normalizeFileType(fileType) {
    if (['dir', 'file', 'symlink'].includes(fileType)) {
      return fileType;
    }
  },

  // TODO: VFS-7643 this will be probably injected from above
  fileRowModel: computed(function fileRowModel() {
    return RowModel.create({
      tableRow: this,
    });
  }),

  isSymlink: equal('type', raw('symlink')),

  fileNameParser: computed('file', function fileNameParser() {
    return FileNameParser.create({ file: this.get('file') });
  }),

  fileNameBase: reads('fileNameParser.base'),

  fileNameSuffix: reads('fileNameParser.suffix'),
});
