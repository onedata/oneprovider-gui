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

const file2 = {
  entityId: 'f2',
};

const file = {
  entityType: 'file',
  entityId: 'f1',
  name: 'Some file',
  hasQos: true,
  belongsTo(relation) {
    if (relation === 'fileQos') {
      return {
        reload: () => file.fileQos,
      };
    }
  },
  fileQos: undefined,
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
  qosRecordsProxy: promiseArray(resolve([{
      entityId: 'q1',
      file,
      fulfilled: true,
      replicasNum: 1,
      expression: '(size=15&storage=sda)|type=xls|one=two|one=two|one=two|one=two|one=two|one=two|one=two|one=two|one=two|one=two|one=two',
    },
    {
      entityId: 'q2',
      file: file2,
      fulfilled: true,
      replicasNum: 2,
      expression: 'size=10',
    },
    {
      entityId: 'q3',
      file,
      fulfilled: false,
      replicasNum: 3,
      expression: 'size=15|storage=sda',
    },
    {
      entityId: 'q4',
      file: file2,
      fulfilled: false,
      replicasNum: 3,
      expression: 'size=15|storage=sda',
    },
    {
      entityId: 'q5',
      file: file2,
      fulfilled: false,
      replicasNum: 3,
      expression: 'size=15|storage=sda',
    },
  ])),
}));

export default Component.extend({
  file: computed(() => file),

  open: true,
});
