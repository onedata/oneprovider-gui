import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { resolve } from 'rsvp';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import wait from 'ember-test-helpers/wait';

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

describe('Integration | Component | qos modal', function () {
  setupComponentTest('qos-modal', {
    integration: true,
  });

  it('renders file name and entry info if at least one item is present', function () {
    const filename = 'first.txt';
    const replicasNum = 32;

    const file = {
      entityType: 'file',
      entityId: 'f1',
      name: filename,
      type: 'file',
      hasParent: true,
      parent: resolve(null),
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
      entries: {
        f1: true,
        f2: false,
      },
      fulfilled: true,
      updateQosRecordsProxy() {
        return this.qosRecordsProxy;
      },
      qosRecordsProxy: promiseArray(resolve([
        new MockQos({
          entityId: 'q1',
          file,
          fulfilled: true,
          replicasNum,
          expressionRpn: ['storage_type=dummy'],
        }),
      ])),
    }));

    this.set('file', file);
    this.on('getDataUrl', () => 'https://example.com');
    this.render(hbs `{{qos-modal
      open=true
      file=file
      getDataUrl=(action "getDataUrl")
    }}`);

    return wait().then(() => {
      console.log(this.$().html());
      expect(this.$('.filename'), 'file name').to.contain(filename);
      expect(this.$('.qos-entry .replicas-number'), 'replicas number')
        .to.contain(replicasNum.toString());
      expect(this.$('.qos-entry'), 'qos-entry')
        .to.contain('storage_type=dummy');
    });
  });
});
