import { expect } from 'chai';
import { describe, it } from 'mocha';
import FileQuery from 'oneprovider-gui/utils/file-query';

describe('Unit | Utility | file-query', function () {
  it('can be created', function () {
    const result = FileQuery.create();
    expect(result).to.be.ok;
  });
});
