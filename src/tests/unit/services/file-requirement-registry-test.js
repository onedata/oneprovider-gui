import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import FileQuery from 'oneprovider-gui/utils/file-query';
import { lookupService } from '../../helpers/stub-service';
import { all as allFulfilled } from 'rsvp';
import _ from 'lodash';
import { clearStoreAfterEach } from '../../helpers/clear-store';
import { get } from '@ember/object';
import { getFileGri } from 'oneprovider-gui/models/file';
import sinon from 'sinon';

describe('Unit | Service | file-requirement-registry', function () {
  setupTest();
  clearStoreAfterEach();

  it('private method propertiesToAttrs returns an array of attributes for provided properties', async function () {
    const service = this.owner.lookup('service:file-requirement-registry');

    const attrs = service.propertiesToAttrs([
      // some properties mapping 1:1 with attributes
      'name',
      'size',
      'posixPermissions',
      // some attributes normalized by serializer to create relations
      'shareRecords',
      'parent',
      'provider',
      // computed properties with single dependent attribute
      'dataIsProtected',
      'metadataIsProtected',
      'isArchiveRootDir',
      // computed properties with mutiple dependent attributes
      'originalName',
      'effFile',
    ]);

    const expectedAttrs = [
      'name',
      'size',
      'posixPermissions',
      'shares',
      'parentId',
      'providerId',
      'effProtectionFlags',
      'archiveId',
      'conflictingName',
      'type',
      'symlinkValue',
    ].sort();
    expect([...attrs].sort()).to.deep.equal(expectedAttrs);
  });

  it('getRequirements returns all currently registered requirements with basic, without removed',
    async function () {
      const service = this.owner.lookup('service:file-requirement-registry');
      const consumer1 = { name: 'c1' };
      const consumer2 = { name: 'c2' };
      const consumer3 = { name: 'c3' };
      const req1 = new FileRequirement({
        parentId: 'p1',
        properties: ['atime', 'ctime'],
      });
      const req2 = new FileRequirement({
        parentId: 'p2',
        properties: ['size'],
      });
      const req31 = new FileRequirement({
        parentId: 'p3',
        properties: ['distribution'],
      });
      const req32 = new FileRequirement({
        parentId: 'p4',
        properties: ['acl'],
      });

      await service.setRequirements(consumer1, req1);
      await service.setRequirements(consumer2, req2);
      await service.setRequirements(consumer3, req31, req32);
      service.deregisterRequirements(consumer2);

      const resultRequirements = service.getRequirements();
      // including basic requirement
      expect(resultRequirements).to.have.lengthOf(4);
      expect(resultRequirements).to.include(req1);
      expect(resultRequirements).to.include(req31);
      expect(resultRequirements).to.include(req32);
    }
  );

  it('getRequiredAttributes returns attributes for given requirements (parentId) using query', async function () {
    const service = this.owner.lookup('service:file-requirement-registry');
    const consumer1 = { name: 'c1' };
    const consumer2 = { name: 'c2' };
    const consumer3 = { name: 'c3' };
    const req1 = new FileRequirement({
      parentId: 'p1',
      properties: ['name', 'ctime', 'mtime'],
    });
    const req2 = new FileRequirement({
      parentId: 'p2',
      properties: ['size'],
    });
    const req31 = new FileRequirement({
      parentId: 'p2',
      properties: ['originalName'],
    });
    const req32 = new FileRequirement({
      parentId: 'p3',
      properties: ['acl'],
    });
    const query = new FileQuery({
      parentId: 'p2',
    });
    await service.setRequirements(consumer1, req1);
    await service.setRequirements(consumer2, req2);
    await service.setRequirements(consumer3, req31, req32);

    const resultAttrs = service.getRequiredAttributes(query).sort();

    expect(resultAttrs).to.deep.equal([
      'size',
      // additional attributes added always by default
      'fileId',
      'type',
      'parentId',
      'symlinkValue',
      'conflictingName',
      'name',
    ].sort());
  });

  it('getRequiredAttributes returns attributes registered only using parent-queries for parent query',
    async function () {
      const service = this.owner.lookup('service:file-requirement-registry');
      const store = lookupService(this, 'store');
      const consumer1 = {};
      const parent1Id = 'parent1';
      const parent1Gri = getFileGri(parent1Id);
      const parent1 = await store.createRecord('file', {
        id: parent1Gri,
        name: 'parent-1',
      }).save();
      const file1Gri = getFileGri('file1');
      const file1 = await store.createRecord('file', {
        id: file1Gri,
        parent: parent1,
        name: 'file-1',
      }).save();
      mockFileRecordRegistryFiles(this, [parent1, file1]);
      const req1 = new FileRequirement({
        parentId: parent1Id,
        properties: ['mtime'],
      });
      const req2 = new FileRequirement({
        parentId: parent1Id,
        properties: ['atime'],
      });
      const req3 = new FileRequirement({
        fileGri: file1Gri,
        properties: ['ctime'],
      });
      await service.setRequirements(consumer1, req1, req2, req3);
      const query = new FileQuery({
        parentId: parent1Id,
      });

      const resultAttrs = service.getRequiredAttributes(query);

      expect(resultAttrs).to.contain('mtime');
      expect(resultAttrs).to.contain('atime');
      expect(resultAttrs).to.not.contain('ctime');
    },
  );

  it('private method getAbsentRequirementSet gets requirements that add new properties for consumer files',
    async function () {
      const service = lookupService(this, 'file-requirement-registry');
      const consumer1 = { name: 'c1' };
      const req1 = new FileRequirement({
        fileGri: 'file.a1.instance:private',
        properties: ['posixPermissions', 'qosStatus'],
      });
      const req2 = new FileRequirement({
        fileGri: 'file.a2.instance:private',
        properties: ['mtime', 'ctime'],
      });
      const req3 = new FileRequirement({
        fileGri: 'file.a3.instance:private',
        properties: ['size'],
      });
      // an old condition with the same properties
      const newReq1 = new FileRequirement({
        fileGri: 'file.a1.instance:private',
        properties: ['posixPermissions', 'qosStatus'],
      });
      // a new condition with the same properties
      const newReq2 = new FileRequirement({
        fileGri: 'file.b1.instance:private',
        properties: ['posixPermissions', 'qosStatus'],
      });
      // a weaker requirement for old condition (req2)
      const newReq3 = new FileRequirement({
        fileGri: 'file.a2.instance:private',
        properties: ['mtime'],
      });
      // a stronger requirement for old condition
      const newReq4 = new FileRequirement({
        fileGri: 'file.a2.instance:private',
        properties: ['mtime', 'ctime', 'atime'],
      });
      await service.setRequirements(consumer1, req1, req2, req3);

      const absentRequirementSet =
        service.getAbsentRequirementSet([newReq1, newReq2, newReq3, newReq4]);

      expect([...absentRequirementSet.values()].sort())
        .to.deep.equal([newReq2, newReq4].sort());
    }
  );

  it('private method getFilesToUpdate returns only files needing an update for new requirements',
    async function () {
      const fileRequirementRegistry = lookupService(this, 'file-requirement-registry');
      const store = lookupService(this, 'store');

      const fileIds = ['a1', 'a2', 'a3', 'b1'];
      const files = await allFulfilled(
        fileIds.map(fileId =>
          store.createRecord('file', {
            id: getFileGri(fileId, 'private'),
            name: `file-${fileId}`,
          }).save()
        )
      );
      mockFileRecordRegistryFiles(this, files);
      const fileMap = _.zipObject(fileIds, files);
      const consumer1 = { name: 'c1' };
      const req1 = new FileRequirement({
        fileGri: get(fileMap.a1, 'id'),
        properties: ['posixPermissions', 'qosStatus'],
      });
      const req2 = new FileRequirement({
        fileGri: get(fileMap.a2, 'id'),
        properties: ['mtime', 'ctime'],
      });
      const req3 = new FileRequirement({
        fileGri: get(fileMap.a3, 'id'),
        properties: ['size'],
      });
      // an old condition with the same properties
      const newReq1 = new FileRequirement({
        fileGri: get(fileMap.a1, 'id'),
        properties: ['posixPermissions', 'qosStatus'],
      });
      // a new condition with the same properties
      const newReq2 = new FileRequirement({
        fileGri: get(fileMap.b1, 'id'),
        properties: ['posixPermissions', 'qosStatus'],
      });
      // a weaker requirement for old condition (req2)
      const newReq3 = new FileRequirement({
        fileGri: get(fileMap.a2, 'id'),
        properties: ['mtime'],
      });
      // a stronger requirement for old condition
      const newReq4 = new FileRequirement({
        fileGri: get(fileMap.a2, 'id'),
        properties: ['mtime', 'ctime', 'atime'],
      });
      const newRequirements = [newReq1, newReq2, newReq3, newReq4];
      await fileRequirementRegistry.setRequirements(consumer1, req1, req2, req3);

      const filesToUpdate =
        fileRequirementRegistry.getFilesToUpdate(newRequirements);

      expect([...filesToUpdate].sort()).to.deep.equal([fileMap.b1, fileMap.a2].sort());
    }
  );

  it('setRequirement invokes reload on files that have new required properties',
    async function () {
      const fileRequirementRegistry = lookupService(this, 'file-requirement-registry');
      const store = lookupService(this, 'store');

      const fileIds = ['a1', 'a2', 'a3', 'b1'];
      const files = await allFulfilled(
        fileIds.map(fileId =>
          store.createRecord('file', {
            id: getFileGri(fileId, 'private'),
            name: `file-${fileId}`,
          }).save()
        )
      );
      mockFileRecordRegistryFiles(this, files);
      const fileMap = _.zipObject(fileIds, files);
      const reloadSpies = files.map(file => sinon.spy(file, 'reload'));
      const reloadSpyMap = _.zipObject(fileIds, reloadSpies);
      const consumer1 = { name: 'c1' };
      const req1 = new FileRequirement({
        fileGri: get(fileMap.a1, 'id'),
        properties: ['posixPermissions', 'qosStatus'],
      });
      const req2 = new FileRequirement({
        fileGri: get(fileMap.a2, 'id'),
        properties: ['mtime', 'ctime'],
      });
      const req3 = new FileRequirement({
        fileGri: get(fileMap.a3, 'id'),
        properties: ['size'],
      });
      // an old condition with the same properties
      const newReq1 = new FileRequirement({
        fileGri: get(fileMap.a1, 'id'),
        properties: ['posixPermissions', 'qosStatus'],
      });
      // a new condition with the same properties
      const newReq2 = new FileRequirement({
        fileGri: get(fileMap.b1, 'id'),
        properties: ['posixPermissions', 'qosStatus'],
      });
      // a weaker requirement for old condition (req2)
      const newReq3 = new FileRequirement({
        fileGri: get(fileMap.a2, 'id'),
        properties: ['mtime'],
      });
      // a stronger requirement for old condition
      const newReq4 = new FileRequirement({
        fileGri: get(fileMap.a2, 'id'),
        properties: ['mtime', 'ctime', 'atime'],
      });
      const newRequirements = [newReq1, newReq2, newReq3, newReq4];
      await fileRequirementRegistry.setRequirements(consumer1, req1, req2, req3);
      for (const reloadSpy of Object.values(reloadSpyMap)) {
        reloadSpy.resetHistory();
      }

      await fileRequirementRegistry.setRequirements(consumer1, ...newRequirements);

      expect(reloadSpyMap.a1, 'a1').to.be.not.called;
      expect(reloadSpyMap.a2, 'a2').to.be.calledOnce;
      expect(reloadSpyMap.a3, 'a3').to.be.not.called;
      expect(reloadSpyMap.b1, 'b1').to.be.calledOnce;
    }
  );
});

/**
 *
 * @param {Mocha.Context} mochaContext
 * @param {Array<Models.File>} files
 */
function mockFileRecordRegistryFiles(mochaContext, files) {
  const fileRecordRegistry = lookupService(mochaContext, 'fileRecordRegistry');
  sinon.stub(fileRecordRegistry, 'getRegisteredFiles').returns(files);
}
