import EmberObject, { computed } from '@ember/object';
import { A } from '@ember/array';
import { resolve } from 'rsvp';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';

const FakeFile = EmberObject.extend({
  hasParent: computed('__parent', function () {
    return this.get('__parent') != null;
  }),
  parent: computed(function () {
    return new resolve(this.get('__parent'));
  }),
});

function generateBreadcrumbsItems(numberOfFiles) {
  let result = {};
  result.fileNames = [...Array(numberOfFiles).keys()].map(i => `file-${i}`);
  result.files = result.fileNames.map(name => FakeFile.create({
    name: name,
    id: name + '-id',
  }));
  for (let i = 0; i < result.files.length; i += 1) {
    /* jshint loopfunc: true */
    let ic = i;
    result.files[ic].set('__parent', result.files[ic - 1]);
  }
  result.bitems = A(result.files.map(file => FileBreadcrumbsItem.create({
    file,
  })));
  return result;
}

export default generateBreadcrumbsItems;
