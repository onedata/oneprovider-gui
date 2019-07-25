import { expect } from 'chai';
import {
  describe,
  it,
} from 'mocha';
import filterBreadcrumbsItems from 'oneprovider-gui/utils/filter-breadcrumbs-items';
import generateBreadcrumbsItems from '../../helpers/generate-breadcrumbs-items';
import { get } from '@ember/object';

describe('Unit | Utility | filter breadcrumbs items', function () {
  it('should return empty array, if there is only one element',
    function () {
      const numberOfFiles = 1;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 1)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(0);
        });
    }
  );

  it('should return array with first (root) and ellipsis, for count 0, 1 and 2',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      function checkTwoItems(bitems, resultItems, count) {
        expect(resultItems, `for count ${count} there are 2 items`)
          .to.have.lengthOf(2);
        expect(
          resultItems.get('firstObject.file.name'),
          `for count ${count} first element of new breadcrumbs is root`
        ).to.equal(bitems.get('firstObject.file.name'));
        expect(
          get(resultItems[1], 'isEllipsis'),
          `for count ${count} second element of new breadcrumbs is ellipsis`
        ).to.equal(true);
      }

      return filterBreadcrumbsItems(bitems, 0)
        .then(resultItems => checkTwoItems(bitems, resultItems, 0))
        .then(() => filterBreadcrumbsItems(bitems, 1))
        .then(resultItems => checkTwoItems(bitems, resultItems, 1))
        .then(() => filterBreadcrumbsItems(bitems, 2))
        .then(resultItems => checkTwoItems(bitems, resultItems, 2));
    }
  );

  it('should return root, ellipsis and parent of last for count 3',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 3)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(3);
          expect(get(resultItems[0], 'isRoot')).to.equal(true);
          expect(get(resultItems[1], 'isEllipsis')).to.equal(true);
          expect(get(resultItems[1], 'file.name')).to.equal('file-7');
          expect(get(resultItems[2], 'name')).to.equal('file-8');
        });
    }
  );

  it('should return root, ellipsis and parent of last for count 4 and 4 files',
    function () {
      const numberOfFiles = 4;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 4)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(3);
          expect(get(resultItems[0], 'isRoot'), 'root').to.equal(true);
          expect(get(resultItems[1], 'isEllipsis'), 'ellipsis').to.equal(true);
          expect(get(resultItems[1], 'file.name')).to.equal('file-1');
          expect(get(resultItems[2], 'name')).to.equal('file-2');
        });
    }
  );

  it('should return root, first child, ellipsis and parent of last for count 4',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 4)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(4);
          expect(get(resultItems[0], 'isRoot')).to.equal(true);
          expect(get(resultItems[1], 'name')).to.equal('file-1');
          expect(get(resultItems[2], 'isEllipsis')).to.equal(true);
          expect(get(resultItems[2], 'file.name')).to.equal('file-7');
          expect(get(resultItems[3], 'name')).to.equal('file-8');
        });
    }
  );

  it('should return root, first child, ellipsis, parent of next and parent of last for count 5',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 5)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(5);
          expect(get(resultItems[0], 'isRoot')).to.equal(true);
          expect(get(resultItems[1], 'name')).to.equal('file-1');
          expect(get(resultItems[2], 'isEllipsis')).to.equal(true);
          expect(get(resultItems[2], 'file.name')).to.equal('file-6');
          expect(get(resultItems[3], 'name')).to.equal('file-7');
          expect(get(resultItems[4], 'name')).to.equal('file-8');
        });
    }
  );

  it('should return root, f1, ellipsis, f6, f7, f8 for count 6',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 6)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(6);
          expect(get(resultItems[0], 'isRoot')).to.equal(true);
          expect(get(resultItems[1], 'name')).to.equal('file-1');
          expect(get(resultItems[2], 'isEllipsis')).to.equal(true);
          expect(get(resultItems[2], 'file.name')).to.equal('file-5');
          expect(get(resultItems[3], 'name')).to.equal('file-6');
          expect(get(resultItems[4], 'name')).to.equal('file-7');
          expect(get(resultItems[5], 'name')).to.equal('file-8');
        });
    }
  );

  it('should return root, f1, f2, f3 for count 6 but 5 files available',
    function () {
      const numberOfFiles = 5;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 6)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(4);
          expect(get(resultItems[0], 'isRoot')).to.equal(true);
          expect(get(resultItems[0], 'name')).to.equal('file-0');
          expect(get(resultItems[1], 'name')).to.equal('file-1');
          expect(get(resultItems[2], 'name')).to.equal('file-2');
          expect(get(resultItems[3], 'name')).to.equal('file-3');
        });
    }
  );

  it('should return root, f1, .., f2, f3 for count 6 but 5 files available',
    function () {
      const numberOfFiles = 5;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);

      return filterBreadcrumbsItems(bitems, 6)
        .then(resultItems => {
          expect(resultItems).to.have.lengthOf(4);
          expect(get(resultItems[0], 'isRoot')).to.equal(true);
          expect(get(resultItems[0], 'name')).to.equal('file-0');
          expect(get(resultItems[1], 'name')).to.equal('file-1');
          expect(get(resultItems[2], 'name')).to.equal('file-2');
          expect(get(resultItems[3], 'name')).to.equal('file-3');
        });
    }
  );
});
