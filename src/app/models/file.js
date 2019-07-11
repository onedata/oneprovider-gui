/**
 * Single file or directory model.
 * Currently only a stub for future GraphSync model.
 * 
 * @module models/file
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';

export default EmberObject.extend({
  name: undefined,
  type: undefined,
  modificationTime: undefined,
  provider: undefined,
  totalChildrenCount: undefined,
  canViewDir: undefined,
  permissions: undefined,
  parent: undefined,
});
