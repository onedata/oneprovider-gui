import { expect } from 'chai';
import { describe, it } from 'mocha';
import fileName from 'oneprovider-gui/utils/file-name';

describe('Unit | Utility | file name', function () {
  it('parses file name from POSIX path with subdirs', function () {
    const result = fileName('/one/two/three.zip');
    expect(result).to.equal('three.zip');
  });

  it('parses file name in root of filesystem', function () {
    const result = fileName('/file.zip');
    expect(result).to.equal('file.zip');
  });

  it('parses file name only', function () {
    const result = fileName('file.zip');
    expect(result).to.equal('file.zip');
  });
});
