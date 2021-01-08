import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { resolve } from 'rsvp';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import wait from 'ember-test-helpers/wait';
import { lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';

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

  it('renders file name and entry info if at least one item is present',
    async function () {
      const filename = 'first.txt';
      const replicasNum = 32;

      const file = {
        entityType: 'file',
        entityId: 'f1',
        name: filename,
        index: filename,
        type: 'file',
        hasParent: true,
        parent: resolve(null),
        hasQos: true,
        belongsTo(relation) {
          if (relation === 'fileQosSummary') {
            return {
              reload: () => file.fileQosSummary,
              id: () => 'file.f1.qos_summary:private',
            };
          } else {
            throw new Error('invalid file test relation: ' + relation);
          }
        },
        fileQosSummary: undefined,
        reload() {
          return this;
        },
      };
      const summaryPromise = promiseObject(resolve({
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
            expressionRpn: ['storage_type', 'dummy', '='],
          }),
        ])),
      }));
      file.fileQosSummary = summaryPromise;
      file.getRelation = function getRelation(name) {
        if (name === 'fileQosSummary') {
          return summaryPromise;
        }
      };
      sinon.stub(lookupService(this, 'store'), 'findRecord')
        .withArgs('fileQosSummary', 'file.f1.qos_summary:private')
        .resolves(file.fileQosSummary);

      this.set('files', [file]);
      this.on('getDataUrl', () => 'https://example.com');
      this.render(hbs `{{qos-modal
        open=true
        mode="show"
        files=files
        updateInterval=null
        getDataUrl=(action "getDataUrl")
      }}`);

      await wait();

      expect(this.$('.filename'), 'file name').to.contain(filename);
      expect(this.$('.qos-entry .replicas-number'), 'replicas number')
        .to.contain(replicasNum.toString());
      expect(this.$('.qos-entry').text(), 'qos-entry')
        .to.match(/.*storage_type\s*=\s*"dummy".*/);
    });
});
