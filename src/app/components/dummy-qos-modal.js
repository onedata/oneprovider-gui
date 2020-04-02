/**
 * Container for development tests of qos-modal
 * 
 * @module components/dummy-qos-modal
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { resolve } from 'rsvp';

class MockQos {
  constructor(data) {
    this.entityId = data.entityId;
    this.file = resolve(data.file);
    this.fulfilled = data.fulfilled;
    this.replicasNum = data.replicasNum;
    this.expressionRpn = data.expressionRpn;
  }
  belongsTo(relation) {
    if (relation === 'file') {
      return {
        id: () => `file.${this.file.entityId}.instance:private`,
      };
    } else {
      throw new Error(`relation ${relation} not mocked`);
    }
  }
}

const dir1 = {
  entityId: 'dir1',
  name: 'one',
  type: 'dir',
  hasParent: false,
  parent: resolve(null),
};

const dir2 = {
  entityId: 'dir2',
  name: 'two',
  type: 'dir',
  hasParent: true,
  parent: resolve(dir1),
};

const dir3 = {
  entityId: 'dir2',
  name: 'three',
  type: 'dir',
  hasParent: true,
  parent: resolve(dir2),
};

const file2 = {
  entityId: 'f2',
  name: 'second.txt',
  type: 'dir',
  hasParent: true,
  parent: resolve(dir3),
  reload() {
    return this;
  },
};

const file = {
  entityType: 'file',
  entityId: 'f1',
  name: 'first.txt',
  type: 'file',
  hasParent: true,
  parent: resolve(dir1),
  hasQos: true,
  belongsTo(relation) {
    if (relation === 'fileQos') {
      return {
        reload: () => file.fileQos,
      };
    }
  },
  fileQos: undefined,
  reload() {
    return this;
  },
};

file.fileQos = promiseObject(resolve({
  qosEntries: {
    f1: true,
    f2: false,
  },
  fulfilled: true,
  updateQosRecordsProxy() {
    return this.qosRecordsProxy;
  },
  qosRecordsProxy: promiseArray(resolve([new MockQos({
      entityId: 'q1',
      file,
      fulfilled: true,
      replicasNum: 1,
      expressionRpn: [
        'storage_type=dummy',
        'speed=178',
        '|',
        'latency=87',
        '&',
        'storage_type=dummy',
        '&',
        'storage_type=dummy',
        '&',
        'storage_type=dummy',
        '|',
        'storage_type=dummy',
        '&',
        'storage_type=test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test_test',
        '&',
      ],
    }),
    new MockQos({
      entityId: 'q2',
      file: file2,
      fulfilled: true,
      replicasNum: 2,
      expressionRpn: ['size=10'],
    }),
    new MockQos({
      entityId: 'q3',
      file,
      fulfilled: false,
      replicasNum: 3,
      expressionRpn: ['storage_type=dummy', 'speed=178', '|', 'latency=87', '&'],
    }),
    new MockQos({
      entityId: 'q4',
      file: file2,
      fulfilled: false,
      replicasNum: 3,
      expressionRpn: ['storage_type=dummy', 'speed=178', '|', 'latency=87', '&'],
    }),
    new MockQos({
      entityId: 'q5',
      file: file2,
      fulfilled: false,
      replicasNum: 3,
      expressionRpn: ['storage_type=dummy', 'speed=178', '|', 'latency=87', '&'],
    }),
  ])),
}));

export default Component.extend({
  file: computed(() => file),

  open: true,

  actions: {
    getDataUrl() {
      return 'https://example.com';
    },
  },
});
