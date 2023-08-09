import { expect } from 'chai';
import { describe, it } from 'mocha';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

describe('Unit | Utility | file-requirement', function () {
  // Replace this with your real tests.
  it('can be created', function () {
    const result = FileRequirement.create({
      properties: ['name'],
    });
    expect(result).to.be.ok;
  });
});
