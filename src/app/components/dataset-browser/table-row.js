// FIXME: jsdoc

import FbTableRow from 'oneprovider-gui/components/file-browser/fb-table-row';
import { hash } from 'ember-awesome-macros';
import { computed } from '@ember/object';

export default FbTableRow.extend({
  classNames: ['filesystem-table-row'],

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
