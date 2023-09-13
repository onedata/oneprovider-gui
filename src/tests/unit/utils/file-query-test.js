import { expect } from 'chai';
import { describe, it, context } from 'mocha';
import FileQuery from 'oneprovider-gui/utils/file-query';
import { getFileGri } from 'oneprovider-gui/models/file';

describe('Unit | Utility | file-query', function () {
  it('can be created without any condition', function () {
    const result = new FileQuery();
    expect(result).to.be.ok;
  });

  it('matches to another query when parentIds are the same', function () {
    const parentId =
      'Z3VpZCM5MjY3NmQ0YjYwZTA4YzA0MWQ1NGZkMmFlOGQxNWNhZGNoZjZhYyNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA';
    const query1 = new FileQuery({ parentId });
    const query2 = new FileQuery({ parentId });

    expect(query1.matches(query2)).to.be.true;
  });

  it('does not match to another query if parentIds are used and are not the same', function () {
    const parentId1 =
      'Z3VpZCM5MjY3NmQ0YjYwZTA4YzA0MWQ1NGZkMmFlOGQxNWNhZGNoZjZhYyNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA';
    const parentId2 =
      'Z3VpZCNzcGFjZV9jYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZCNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA';
    const query1 = new FileQuery({ parentId: parentId1 });
    const query2 = new FileQuery({ parentId: parentId2 });

    expect(query1.matches(query2)).to.be.false;
  });

  it('matches to another query when fileGris are the same', function () {
    const fileGri = getFileGri(
      'Z3VpZCM5MjY3NmQ0YjYwZTA4YzA0MWQ1NGZkMmFlOGQxNWNhZGNoZjZhYyNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA',
      'private'
    );
    const query1 = new FileQuery({ fileGri });
    const query2 = new FileQuery({ fileGri });

    expect(query1.matches(query2)).to.be.true;
  });

  it('matches to another query if one condition is empty', function () {
    const fileGri = getFileGri(
      'Z3VpZCM5MjY3NmQ0YjYwZTA4YzA0MWQ1NGZkMmFlOGQxNWNhZGNoZjZhYyNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA',
      'private'
    );
    const query1 = new FileQuery();
    const query2 = new FileQuery({ fileGri });

    expect(query1.matches(query2)).to.be.true;
  });

  it('does not match to another query if fileGris are used and are not the same', function () {
    const fileGri1 = getFileGri(
      'Z3VpZCM5MjY3NmQ0YjYwZTA4YzA0MWQ1NGZkMmFlOGQxNWNhZGNoZjZhYyNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA',
      'private'
    );
    const fileGri2 = getFileGri(
      'Z3VpZCNzcGFjZV9jYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZCNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA',
      'private'
    );
    const query1 = new FileQuery({ fileGri: fileGri1 });
    const query2 = new FileQuery({ fileGri: fileGri2 });

    expect(query1.matches(query2)).to.be.false;
  });

  it('does not match to another query if one query uses fileId and another uses parentId', function () {
    const fileId =
      'Z3VpZCM5MjY3NmQ0YjYwZTA4YzA0MWQ1NGZkMmFlOGQxNWNhZGNoZjZhYyNjYzY4NTU1N2NiMzc5NDdhMTAwZDNkMWYyYmEzYjI3NGNoNDlhZA';
    const fileGri = getFileGri(
      fileId,
      'private'
    );
    const query1 = new FileQuery({ fileGri });
    const query2 = new FileQuery({ parentId: fileId });

    expect(query1.matches(query2)).to.be.false;
  });

  it('can be stringified, presenting the condition', function () {
    const query = new FileQuery({
      fileGri: 'file.12345.instance:private',
    });

    const result = query.toString();

    expect(result).to.be.equal(
      '<FileQuery:fileGri-file.12345.instance:private>'
    );
  });

  context('matchesFile method', function () {
    it('returns true for file that matches the fileGri condition', function () {
      const file = new MockFile({
        id: 'file.12345.instance:private',
      });
      const query = new FileQuery({
        fileGri: 'file.12345.instance:private',
      });

      const result = query.matchesFile(file);

      expect(result).to.be.true;
    });

    it('returns true for file always if query is without conditions', function () {
      const file = new MockFile({
        id: 'file.12345.instance:private',
      });
      const query = new FileQuery({});

      const result = query.matchesFile(file);

      expect(result).to.be.true;
    });

    it('returns false for file that does not match the fileGri condition', function () {
      const file = new MockFile({
        id: 'file.12345.instance:private',
      });
      const query = new FileQuery({
        fileGri: 'file.67890.instance:private',
      });

      const result = query.matchesFile(file);

      expect(result).to.be.false;
    });

    it('returns false for file that does not match the condition because of different query type',
      function () {
        const file = new MockFile({
          id: 'file.12345.instance:private',
        });
        const query = new FileQuery({
          parentId: 'file.67890.instance:private',
        });

        const result = query.matchesFile(file);

        expect(result).to.be.false;
      }
    );
  });
});

class MockFile {
  constructor(data) {
    this.id = data.id;
    this.parentId = data.parentId;
  }
  relationEntityId(relation) {
    if (relation === 'parent') {
      return this.parentId;
    }
  }
}
