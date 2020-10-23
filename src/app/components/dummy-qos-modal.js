/**
 * Container for development tests of qos-modal
 * 
 * @module components/dummy-qos-modal
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  mockBackend: service(),

  // FIXME: debug 1 file
  files: collect(
    'mockBackend.entityRecords.chainDir.2',
    // 'mockBackend.entityRecords.chainDir.3',
    // 'mockBackend.entityRecords.chainDir.4',
  ),

  open: true,

  actions: {
    getDataUrl() {
      return 'https://example.com';
    },
  },
});
