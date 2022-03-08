// FIXME: jsdoc

import { alias } from '@ember/object/computed';
import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';
import { equal, raw, conditional } from 'ember-awesome-macros';
import { computed } from '@ember/object';

export default BrowsableWrapper.extend({
  /**
   * @virtual
   */
  file: undefined,

  /**
   * @virtual
   */
  archive: undefined,

  /**
   * @override
   */
  content: alias('file'),

  isArchiveRootDir: equal('file.entityId', 'archive.rootDir.content.entityId'),

  // FIXME: debug code - use conditional version below
  archiveCreating: computed(
    'archive.metaState',
    'isArchiveRootDir',
    function archiveCreating() {
      const res = this.get('archive.metaState') === 'creating' ?
        (this.get('isArchiveRootDir') ? 'direct' : 'ancestor') : 'none';
      return res;
    }
  ),

  // archiveCreating: conditional(
  //   equal('archive.metaState', raw('creating')),
  //   conditional('isArchiveRootDir', raw('direct'), raw('ancestor')),
  //   raw('none'),
  // ),

  archiveFailed: conditional(
    equal('archive.metaState', raw('failed')),
    conditional('isArchiveRootDir', raw('direct'), raw('ancestor')),
    raw('none'),
  ),
});
