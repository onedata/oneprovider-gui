/**
 * Wrapper for archive root dir to change it's name in browser to user-friendly.
 *
 * @module utils/browsable-archive-root-dir
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { reads } from '@ember/object/computed';
import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';

export default BrowsableWrapper.extend({
  /**
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  browsableArchive: undefined,

  name: reads('browsableArchive.name'),

  browsableType: 'file',
});
