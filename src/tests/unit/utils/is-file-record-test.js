import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import isFileRecord from 'oneprovider-gui/utils/is-file-record';
import { lookupService } from '../../helpers/stub-service';
import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';

describe('Unit | Utility | is-file-record', function () {
  setupTest('util:is-file-record', {});

  it('returns true for file record created with store', function () {
    const store = lookupService(this, 'store');
    const file = store.createRecord('file', {
      name: 'hello',
    });

    const result = isFileRecord(file);

    expect(result).to.be.true;
  });

  it('returns true for wrapped file record created with store', function () {
    const store = lookupService(this, 'store');
    const file = store.createRecord('file', {
      name: 'hello',
    });
    const wrappedFile = BrowsableWrapper.create({ content: file });

    const result = isFileRecord(wrappedFile);

    expect(result).to.be.true;
  });

  it('returns false for wrapped plain object', function () {
    const wrappedObject = BrowsableWrapper.create({ content: { name: 'hello' } });

    const result = isFileRecord(wrappedObject);

    expect(result).to.be.false;
  });

  it('returns false for plain object', function () {
    const fakeFile = {
      name: 'hello',
    };

    const result = isFileRecord(fakeFile);

    expect(result).to.be.false;
  });

  it('returns false for a string', function () {
    const result = isFileRecord('file');
    expect(result).to.be.false;
  });

  it('returns false for null', function () {
    const result = isFileRecord(null);
    expect(result).to.be.false;
  });

  it('returns false for no arguments', function () {
    const result = isFileRecord();
    expect(result).to.be.false;
  });
});
