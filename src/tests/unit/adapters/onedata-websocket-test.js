import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import { lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';
import { getFileGri } from 'oneprovider-gui/models/file';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import _ from 'lodash';

describe('Unit | Adapter | onedata-websocket', function () {
  setupTest();

  it('findRecord adds required attributes from global registry if not provided in adapterOptions',
    async function () {
      const adapter = this.owner.lookup('adapter:onedata-websocket');
      const onedataGraph = lookupService(this, 'onedataGraph');
      const fileRequirementRegistry = lookupService(this, 'fileRequirementRegistry');
      const store = {};
      const type = createModelType('file');
      const snapshot = createSnapshot();
      const fileGri = getFileGri('12345');
      const consumer1 = { name: 'c1' };
      const requirement1 = FileRequirement.create({
        fileGri,
        properties: ['ctime', 'mtime', 'atime'],
      });
      await fileRequirementRegistry.setRequirements(consumer1, requirement1);
      const requestStub = sinon.stub(onedataGraph, 'request');
      requestStub.resolves({});

      await adapter.findRecord(store, type, fileGri, snapshot);

      const expectedAttributes = [
        // attributes added by default
        'conflictingName',
        'fileId',
        'parentId',
        'name',
        'type',
        'symlinkValue',
        // attributes from requirement1
        'ctime',
        'mtime',
        'atime',
      ].sort();
      expect(requestStub).to.have.been.calledWith(sinon.match((request) =>
        Array.isArray(request?.data?.attributes) &&
        _.isEqual([...request.data.attributes].sort(), expectedAttributes)
      ));
    });
});

function createModelType(modelName) {
  return {
    modelName,
    findBlockingRequests() {
      return [];
    },
  };
}

function createSnapshot() {
  return new FakeSnapshot();
}

class FakeSnapshot {
  belongsTo() {
    return null;
  }
}
