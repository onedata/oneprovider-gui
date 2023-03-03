import EmberObject from '@ember/object';
import { reads, not } from '@ember/object/computed';

/**
 * An envelope Ember Class for `FileBreadcrumbs`.
 *
 * @author Jakub Liput
 * @copyright (C) 2016-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * @class
 * A model for `FileBreadcrumbs` component used
 * mainly internally in file breadcrumbs.
 */
const FileBreadcrumbsItem = EmberObject.extend({
  /**
   * @virtual
   * @type {File}
   */
  file: null,

  /**
   * @virtual
   * Set to true if this item is an ellipsis
   * @type {boolean}
   */
  isEllipsis: undefined,

  /**
   * A name of item displayed in breadcrumbs.
   * By default it uses `file.name` computed property.
   * If set, the name is overridden but original `file.name` is untouched.
   *
   * NOTE that it can be shortened with CSS ellipsis later before rendering.
   */
  name: reads('file.name'),

  extraName: reads('file.extraName'),

  isRoot: not('file.hasParent'),
});

export default FileBreadcrumbsItem;
