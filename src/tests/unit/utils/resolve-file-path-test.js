import { expect } from 'chai';
import { describe, it } from 'mocha';
import resolveFilePath from 'oneprovider-gui/utils/resolve-file-path';
import { resolve } from 'rsvp';

describe('Unit | Utility | resolve file path', function () {
  it('resolves array with file parents', function () {
    const fileParentRoot = {
      name: 'My space',
      parent: resolve(null),
      hasParent: false,
    };

    const fileParent3 = {
      name: 'First',
      parent: resolve(fileParentRoot),
      hasParent: true,
    };

    const fileParent2 = {
      name: 'Second directory',
      parent: resolve(fileParent3),
      hasParent: true,
    };

    const fileParent1 = {
      name: 'Third one',
      parent: resolve(fileParent2),
      hasParent: true,
    };

    const file1 = {
      name: 'Onedata.txt',
      parent: resolve(fileParent1),
      hasParent: true,
    };

    resolveFilePath(file1).then(result => {
      expect(result).to.deep.equal([
        fileParentRoot,
        fileParent3,
        fileParent2,
        fileParent1,
        file1,
      ]);
    });
  });
});
