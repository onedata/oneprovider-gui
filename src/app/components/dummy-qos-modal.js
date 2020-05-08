/**
 * Container for development tests of qos-modal
 * 
 * @module components/dummy-qos-modal
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  mockBackend: service(),

  file: reads('mockBackend.entityRecords.chainDir.2'),

  files: collect('file'),

  open: true,

  actions: {
    getDataUrl() {
      return 'https://example.com';
    },
  },
});
