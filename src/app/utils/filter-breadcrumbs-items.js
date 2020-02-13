/**
 * A function for reducing number of breadcrumbs items (for long paths).
 * @module utils/filter-breadcrumbs-items
 * @author Jakub Liput
 * @copyright (C) 2016-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { resolve } from 'rsvp';
import { A } from '@ember/array';
import { get } from '@ember/object';
import addEllipsisBreadcrumbsItem, { ellipsisString } from 'oneprovider-gui/utils/add-ellipsis-breadcrumbs-item';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';

function addEllipsisForLastItem(items, resultArray) {
  return get(items, 'lastObject.file.parent').then(parentOfLast => {
    const ellipsisItem = FileBreadcrumbsItem.create({
      file: parentOfLast,
      name: ellipsisString,
      isEllipsis: true,
    });
    resultArray.push(ellipsisItem);
    return resolve(resultArray);
  });
}

/**
 * Filters elements of given breadcrumbs items array to get array with reduced
 * number of breadcrumbs items WITHOUT last element.
 *  
 * Also an "ellispis item" presented as "..." is added, which is a link to
 * a parent on its right.
 * 
 * Example: we got items: `root > a > b > c > d > e > f > current_dir`.
 * Invoking `filterBreadcrumbsItems(items, 5)` will give us:
 * `root > a > ... > e > f` where "..." is "ellipsis item" (a link to "d").
 * 
 * See tests for more examples.
 * 
 * @param {Ember.A<FileBreadcrumbsItem>} items
 * @param {Number} count max. desired number of entries in result array
 *  NOTE: 0, 1, 2 will give result for 2
 * @returns {RSVP.Promise<Ember.A<FileBreadcrumbsItem>>} resolves with reduced breadcrumbs
 *  items array; max. length of the array is `count+1` or `items` length
 */
export default function filterBreadcrumbsItems(items, count) {
  let resultArray = A();
  const itemsCount = get(items, 'length');
  if (itemsCount > 1) {
    // add first element (root) and current dir
    // [root]
    resultArray.push(get(items, 'firstObject'));

    // we got at least root, some directory and last directory,
    if (itemsCount > 2) {
      // add ellipsis for last item at the end
      // return [root > ellipsis_of_last]
      if (count <= 2) {
        return addEllipsisForLastItem(items, resultArray);
      } else {
        // [root > parent_of_last] and iterate
        resultArray.push(items.objectAt(get(items, 'length') - 2));
      }
    } else {
      return addEllipsisBreadcrumbsItem(resultArray, resultArray.objectAt(0));
    }
  } else {
    // return empty array
    // []
    return resolve(resultArray);
  }
  if (itemsCount === 3) {
    return resolve(resultArray);
  }
  // 4 or more
  if (count > 3 && itemsCount >= 4) {
    // add first child of root
    // [root > root_child > parent_of_last]
    resultArray.splice(1, 0, items.objectAt(1));
  } else {
    // [root > ... > parent_of_last]
    return addEllipsisBreadcrumbsItem(resultArray, resultArray.objectAt(1));
  }
  // 5 or more
  if (count > 4 && itemsCount >= 4) {
    const lastItemToAddIndex = itemsCount - 2;
    let firstItemToAddIndex = lastItemToAddIndex - (count - 4);
    // first item should not be lower than first child of root
    // because we already added it earlier
    firstItemToAddIndex = Math.max(2, firstItemToAddIndex);
    const frontArray = resultArray.slice(0, 2);
    const middleItems = items.slice(firstItemToAddIndex, lastItemToAddIndex);
    const tailArray = resultArray.slice(2, 5);

    resultArray = A(
      frontArray.concat(middleItems, tailArray)
    );
  }

  return addEllipsisBreadcrumbsItem(resultArray, resultArray.objectAt(2));
}
