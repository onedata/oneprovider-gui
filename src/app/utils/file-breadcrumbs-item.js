/**
 * An envelope Ember Class for `FileBreadcrumbs`.
 *
 * @author Jakub Liput
 * @copyright (C) 2016-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

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
   * @virtual optional
   * @type {boolean}
   */
  isRoot: computed('file.hasParent', {
    get() {
      return this.injectedIsRoot ?? !this.file?.hasParent;
    },
    set(key, value) {
      return this.injectedIsRoot = value;
    },
  }),

  /**
   * @virtual optional
   * Set to true if this item is an ellipsis
   * @type {boolean}
   */
  isEllipsis: undefined,

  /**
   * @type {boolean | null}
   */
  injectedIsRoot: null,

  /**
   * A name of item displayed in breadcrumbs.
   * By default it uses `file.name` computed property.
   * If set, the name is overridden but original `file.name` is untouched.
   *
   * NOTE that it can be shortened with CSS ellipsis later before rendering.
   */
  name: reads('file.name'),

  extraName: reads('file.extraName'),
});

export default FileBreadcrumbsItem;
