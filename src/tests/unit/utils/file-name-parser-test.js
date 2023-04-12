import { expect } from 'chai';
import { describe, it } from 'mocha';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';
import { get, setProperties } from '@ember/object';

describe('Unit | Utility | file-name-parser', function () {
  it('returns no suffix if there is no conflicingName', function () {
    const file = {
      name: 'hello',
    };

    const parser = FileNameParser.create({ file });

    expect(get(parser, 'base')).to.equal('hello');
    expect(get(parser, 'suffix')).to.equal(null);
  });

  it('splits file name into base name and suffix when conflictingName is provided', function () {
    const file = {
      name: 'hello@1234',
      conflictingName: 'hello',
    };

    const parser = FileNameParser.create({ file });

    expect(get(parser, 'base')).to.equal('hello');
    expect(get(parser, 'suffix')).to.equal('@1234');
  });

  it('changes base and suffix when file name and conflictingName changes', function () {
    const file = {
      name: 'hello@1234',
      conflictingName: 'hello',
    };

    const parser = FileNameParser.create({ file });

    expect(get(parser, 'base')).to.equal('hello');
    expect(get(parser, 'suffix')).to.equal('@1234');
    setProperties(file, {
      name: 'foo@9876',
      conflictingName: 'foo',
    });
    expect(get(parser, 'base')).to.equal('foo');
    expect(get(parser, 'suffix')).to.equal('@9876');
  });

  it('does not crash on lack of file', function () {
    const parser = FileNameParser.create();

    expect(get(parser, 'base')).to.equal('');
    expect(get(parser, 'suffix')).to.equal(null);
  });

  it('does not crash on lack of file name', function () {
    const parser = FileNameParser.create({
      file: {
        conflictingName: 'hello.txt',
      },
    });

    expect(get(parser, 'base')).to.equal('');
    expect(get(parser, 'suffix')).to.equal(null);
  });
});
