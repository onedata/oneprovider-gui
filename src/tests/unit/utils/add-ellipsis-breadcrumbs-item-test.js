import { expect } from 'chai';
import {
  describe,
  it,
} from 'mocha';
import addEllipsisBreadcrumbsItem from 'oneprovider-gui/utils/add-ellipsis-breadcrumbs-item';
import generateBreadcrumbsItems from 'oneprovider-gui/tests/helpers/generate-breadcrumbs-items';

describe('Unit | Utility | add-ellipsis-breadcrumbs-item', function () {
  it('adds ellipsis item whose file point to parent of its right neighbour',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);
      const itemIndex = 5;
      const item = bitems.objectAt(itemIndex);
      // remove original parent of item
      bitems.removeAt(itemIndex - 1);
      return item.get('file.parent').then(parentFile => {
        addEllipsisBreadcrumbsItem(bitems, item).then(updatedItems => {
          const ellipsisItem = updatedItems.objectAt(itemIndex - 1);
          expect(updatedItems.length).to.equal(numberOfFiles);
          expect(ellipsisItem.get('file.id')).to.equal(parentFile.get('id'));
        });
      });
    }
  );

  it('does not add ellipsis for item that has no parent', function () {
    const { bitems } = generateBreadcrumbsItems(1);
    const item = bitems.get('firstObject');

    return addEllipsisBreadcrumbsItem(bitems, item).then(updatedItems => {
      expect(updatedItems.length).to.equal(1);
      expect(updatedItems.get('firstObject')).to.equal(item);
    });
  });

  it(
    'does not add ellipsis for item if item parent is already predecessor of item in original array',
    function () {
      const numberOfFiles = 10;
      const { bitems } = generateBreadcrumbsItems(numberOfFiles);
      const item = bitems.objectAt(5);

      return addEllipsisBreadcrumbsItem(bitems, item).then(updatedItems => {
        expect(updatedItems.length).to.equal(numberOfFiles);
        expect(updatedItems.objectAt(5)).to.equal(item);
      });
    }
  );
});
