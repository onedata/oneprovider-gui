import { expect } from 'chai';
import { describe, it } from 'mocha';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';
import { get, setProperties } from '@ember/object';
import wait from 'ember-test-helpers/wait';

describe('Unit | Utility | file name parser', function () {
  it('splits file name into base name and suffix', function () {
    const file = {
      name: 'hello@1234',
      index: 'hello',
    };

    const parser = FileNameParser.create({ file });

    expect(get(parser, 'base')).to.equal('hello');
    expect(get(parser, 'suffix')).to.equal('@1234');
  });

  it('changes base and suffix when file name and index changes', function () {
    const file = {
      name: 'hello@1234',
      index: 'hello',
    };

    const parser = FileNameParser.create({ file });

    expect(get(parser, 'base')).to.equal('hello');
    expect(get(parser, 'suffix')).to.equal('@1234');
    setProperties(file, {
      name: 'foo@9876',
      index: 'foo',
    });
    return wait().then(() => {
      expect(get(parser, 'base')).to.equal('foo');
      expect(get(parser, 'suffix')).to.equal('@9876');
    });
  });
});
