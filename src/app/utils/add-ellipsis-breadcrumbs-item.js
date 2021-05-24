/**
 * Adds "ellipsis item" to breadcrumbs `items` for `child`.
 * For example, if we got breadcrumbs: `a > b > c > d > e`,
 * and we invoke function for child `c`, the items will be altered to:
 * `a > b > parent_of_c > c > d > e`.
 * 
 * This function should be used for incomplete paths, where `b`
 * is not a parent of `c`.
 * 
 * NOTE: it changes `items` contents.
 * 
 * @module utils/add-ellipsis-breadcrumbs-item
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { assert } from '@ember/debug';
import { get } from '@ember/object';
import { resolve } from 'rsvp';
import FileBreadcrumbsItem from 'oneprovider-gui/utils/file-breadcrumbs-item';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';

export const ellipsisString = '...';

/**
 * @param {Ember.A<FileBreadcrumbsItem>} items
 * @param {FileBreadcrumbsItem} child
 * @param {Function} resolveParent
 * @returns {Promise<Ember.A<FileBreadcrumbsItem>>} resolves with reference to altered `items`
 */
function addEllipsisBreadcrumbsItem(items, child, resolveParent = defaultResolveParent) {
  assert(
    'utils/add-ellipsis-breadcrumbs-item: child item cannot be null or undefined',
    child
  );
  const hasEllipsisFile = child.get('file.hasParent');
  if (hasEllipsisFile) {
    return resolveParent(get(child, 'file')).then(ellipsisFile => {
      const childIndex = items.indexOf(child);
      const originalParent = items.objectAt(childIndex - 1);
      if (originalParent &&
        get(originalParent, 'file.id') === get(ellipsisFile, 'id')
      ) {
        console.debug(
          `utils/add-ellipsis-breadcrumbs-item: An ellipsis item will be not added for ${get(child, 'name')}, because its parent is already in array`
        );
        return items;
      } else {
        assert(
          childIndex > -1,
          'utils/add-ellipsis-breadcrumbs-item: when adding ellipsis item, the child of ellipsis item should be present in items array'
        );
        const ellipsisItem = FileBreadcrumbsItem.create({
          file: ellipsisFile,
          name: ellipsisString,
          isRoot: (childIndex === 0),
          isEllipsis: true,
        });
        items.splice(childIndex, 0, ellipsisItem);
        return items;
      }
    });
  } else {
    console.debug(
      `utils/add-ellipsis-breadcrumbs-item: An ellipsis item will be not added for ${get(child, 'name')}, because it has no parent`
    );
    return resolve(items);
  }
}

export default addEllipsisBreadcrumbsItem;
