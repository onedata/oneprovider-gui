/**
 * Implementation of table row for filesystem-browser. Represents single file, directory
 * or symlink.
 *
 * @module components/filesystem-browser/table-row-mobile-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import FbTableRow from 'oneprovider-gui/components/file-browser/fb-table-row';
import { equal, raw, conditional, isEmpty, hash } from 'ember-awesome-macros';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

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

  // TODO: VFS-7643 if there will be a table-row model, this will be probably injected from above
  fileRowModel: hash(
    'isSymlink',
  ),

  isSymlink: equal('type', raw('symlink')),

  fileNameParser: computed('file', function fileNameParser() {
    return FileNameParser.create({ file: this.get('file') });
  }),

  fileNameBase: reads('fileNameParser.base'),

  fileNameSuffix: reads('fileNameParser.suffix'),
});
