/**
 * Adds features (see: `component:filesystem-browser/file-features`) to file item
 * displayed in archive filesystem browser.
 *
 * Features are handled in `component:archive-filesystem-browser/file-features-extension`.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { alias } from '@ember/object/computed';
import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';
import { equal, raw, conditional } from 'ember-awesome-macros';

export default BrowsableWrapper.extend({
  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @override
   */
  content: alias('file'),

  // FIXME: file.archive is to remove
  /**
   * @type ComputedProperty<Boolean>
   */
  isArchiveRootDir: equal('file.entityId', 'archive.rootDir.content.entityId'),

  /**
   * @type {ComputedProperty<ItemFeatureMembership>}
   */
  archiveCreating: conditional(
    equal('archive.metaState', raw('creating')),
    // FIXME: file.archive is to remove
    conditional('isArchiveRootDir', raw('direct'), raw('ancestor')),
    raw('none'),
  ),

  /**
   * @type {ComputedProperty<ItemFeatureMembership>}
   */
  archiveFailed: conditional(
    equal('archive.metaState', raw('failed')),
    // FIXME: file.archive is to remove
    conditional('isArchiveRootDir', raw('direct'), raw('ancestor')),
    raw('none'),
  ),

  /**
   * @type {ComputedProperty<ItemFeatureMembership>}
   */
  archiveCancelled: conditional(
    equal('archive.metaState', raw('cancelled')),
    // FIXME: file.archive is to remove
    conditional('isArchiveRootDir', raw('direct'), raw('ancestor')),
    raw('none'),
  ),
});
