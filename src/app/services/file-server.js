/**
 * Non-model server-side file procedures.
 * Currently file list fetching methods to use with infinite scroll list.
 * 
 * @module services/file-server
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { computed, get } from '@ember/object';
import _ from 'lodash';
import { resolve } from 'rsvp';

const testFileName =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export default Service.extend({
  fetchDirChildren(dirId, startFromIndex, size, offset) {
    return resolve(this.mockGetDirChildren(dirId, startFromIndex, size, offset));
  },

  // FIXME: mock, remove in future
  mockGetDirChildren(dirId, index, limit = 100000000, offset = 0) {
    const mockChildren = this.get('mockChildren');
    let arrIndex = _.findIndex(mockChildren, i => get(i, 'index') === index);
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockChildren.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  // FIXME: mock, remove in future
  mockChildren: computed(function mockChildren() {
    const now = Date.now() / 1000;
    return [
      ..._.range(1, 10).map(i => ({
        index: ('0000' + i).substr(-4, 4),
        id: `file.dir-${i}.instance:protected`,
        entityId: `dir-${i}`,
        type: 'dir',
        name: `Directory ${('0000' + i).substr(-4, 4)}`,
        size: 3500000 + 10000 * i,
        modificationTime: now + 1000 * i,
        provider: null,
        totalChildrenCount: 0,
        canViewDir: true,
        permissions: 0o644,
        // FIXME: resolve prev object
        parent: null,
      })),
      {
        index: '0010',
        id: 'file.file-10.instance:protected',
        entityId: 'file-10',
        type: 'file',
        name: testFileName,
        size: 10000,
        modificationTime: now,
        permissions: 0o644,
        parent: null,
      },
      ..._.range(11, 1000).map(i => ({
        index: ('0000' + i).substr(-4, 4),
        id: `file.file-${i}.instance:protected`,
        entityId: `file-${i}`,
        type: 'file',
        name: `File ${('0000' + i).substr(-4, 4)}`,
        size: 250000 + 10000 * i,
        modificationTime: now + 1000 * i,
        provider: null,
        permissions: 0o644,
        parent: null,
      })),
    ];
  }),
});
