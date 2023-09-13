import { expect } from 'chai';
import { describe, it } from 'mocha';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

describe('Unit | Utility | file-requirement', function () {
  it('can be created', function () {
    const result = new FileRequirement({
      properties: ['name'],
    });
    expect(result).to.be.ok;
  });

  it('can be stringified to show query and properties', function () {
    const requirement = new FileRequirement({
      fileGri: 'file.12345.instance:private',
      properties: ['type', 'name', 'conflictingName'],
    });

    const result = requirement.toString();

    expect(result).to.be.equal(
      '<FileRequirement:<FileQuery:fileGri-file.12345.instance:private>|properties:conflictingName,name,type>'
    );
  });

  it('is equal to other requirement if fileGri query and properties are the same', function () {
    const requirement1 = new FileRequirement({
      fileGri: 'file.12345.instance:private',
      properties: ['type', 'name', 'conflictingName'],
    });
    const requirement2 = new FileRequirement({
      fileGri: 'file.12345.instance:private',
      properties: ['name', 'conflictingName', 'type'],
    });

    const result = requirement1.isEqual(requirement2);

    expect(result).to.be.true;
  });

  it('is equal to other requirement if parentId query and properties are the same', function () {
    const requirement1 = new FileRequirement({
      parentId: 'file.12345.instance:private',
      properties: ['type', 'name', 'conflictingName'],
    });
    const requirement2 = new FileRequirement({
      parentId: 'file.12345.instance:private',
      properties: ['name', 'conflictingName', 'type'],
    });

    const result = requirement1.isEqual(requirement2);

    expect(result).to.be.true;
  });

  it('is not equal to other requirement method if properties are not the same', function () {
    const requirement1 = new FileRequirement({
      fileGri: 'file.12345.instance:private',
      properties: ['type', 'name', 'conflictingName'],
    });
    const requirement2 = new FileRequirement({
      fileGri: 'file.12345.instance:private',
      properties: ['name'],
    });

    const result = requirement1.isEqual(requirement2);

    expect(result).to.be.false;
  });

  it('is not equal to other requirement method if properties are the same, but queries are not', function () {
    const requirement1 = new FileRequirement({
      fileGri: 'file.12345.instance:private',
      properties: ['type', 'name', 'conflictingName'],
    });
    const requirement2 = new FileRequirement({
      parentId: 'file.12345.instance:private',
      properties: ['type', 'name', 'conflictingName'],
    });

    const result = requirement1.isEqual(requirement2);

    expect(result).to.be.false;
  });
});
