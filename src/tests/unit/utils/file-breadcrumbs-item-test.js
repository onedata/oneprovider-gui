import { expect } from 'chai';
import {
  describe,
  it,
} from 'mocha';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';
import EmberObject from '@ember/object';

describe('Unit | Utility | file-breadcrumbs-item', function () {
  it('uses file name as its name by default', function () {
    const file = EmberObject.create({
      name: 'hello',
    });
    const fbi = FileBreadcrumbsItem.create({
      file: file,
    });

    expect(fbi.get('name')).to.equal(file.get('name'));
  });

  it('allows to set custom name without altering file name', function () {
    const file = EmberObject.create({
      name: 'hello',
    });
    const fbi = FileBreadcrumbsItem.create({
      file: file,
      name: 'world',
    });

    expect(fbi.get('name'), 'FBItem name is customized').to.equal('world');
    expect(file.get('name'), 'file name stays the same').to.equal('hello');
  });
});
