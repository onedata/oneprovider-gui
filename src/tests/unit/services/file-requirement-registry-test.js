import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import FileQuery from 'oneprovider-gui/utils/file-query';

describe('Unit | Service | file-requirement-registry', function () {
  setupTest();

  it('returns array of attributes for provided properties using propertiesToAttrs method', async function () {
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

  it('returns all currently registered requirements without removed', async function () {
    const service = this.owner.lookup('service:file-requirement-registry');
    const consumer1 = { name: 'c1' };
    const consumer2 = { name: 'c2' };
    const consumer3 = { name: 'c3' };
    const req1 = FileRequirement.create({
      parentGuid: 'p1',
      properties: ['name', 'type'],
    });
    const req2 = FileRequirement.create({
      parentGuid: 'p2',
      properties: ['size'],
    });
    const req31 = FileRequirement.create({
      parentGuid: 'p3',
      properties: ['distribution'],
    });
    const req32 = FileRequirement.create({
      parentGuid: 'p4',
      properties: ['acl'],
    });

    service.setRequirements(consumer1, req1);
    service.setRequirements(consumer2, req2);
    service.setRequirements(consumer3, [req31, req32]);
    service.removeRequirements(consumer2);

    const resultRequirements = service.getRequirements();
    expect(resultRequirements).to.have.lengthOf(3);
    expect(resultRequirements).to.include(req1);
    expect(resultRequirements).to.include(req31);
    expect(resultRequirements).to.include(req32);
  });

  it('returns attributes for given requirements using query', async function () {
    const service = this.owner.lookup('service:file-requirement-registry');
    const consumer1 = { name: 'c1' };
    const consumer2 = { name: 'c2' };
    const consumer3 = { name: 'c3' };
    const req1 = FileRequirement.create({
      parentGuid: 'p1',
      properties: ['name', 'type'],
    });
    const req2 = FileRequirement.create({
      parentGuid: 'p2',
      properties: ['size'],
    });
    const req31 = FileRequirement.create({
      parentGuid: 'p2',
      properties: ['originalName'],
    });
    const req32 = FileRequirement.create({
      parentGuid: 'p3',
      properties: ['acl'],
    });
    const query = FileQuery.create({
      parentGuid: 'p2',
    });
    service.setRequirements(consumer1, req1);
    service.setRequirements(consumer2, req2);
    service.setRequirements(consumer3, [req31, req32]);

    const resultAttrs = service.findAttrsRequirement(query).sort();

    expect(resultAttrs).to.deep.equal([
      'conflictingName',
      'name',
      'size',
      // additional attributes added always by default
      'fileId',
      'type',
    ].sort());
  });
});
