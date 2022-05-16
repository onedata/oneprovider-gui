/**
 * Splits file name and suffix if there is a file name conflict
 *
 * @module utils/file-name-parser
 * @author Jakub Liput
 * @copyright (C) 2020-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, get, getProperties } from '@ember/object';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * An original file name without prefix.
   * Eg. 'hello.txt'
   * @type {ComputedProperty<string>}
   */
  base: computed('file.{name,conflictingName}', function base() {
    const file = this.get('file');
    if (!file) {
      return '';
    }
    const {
      name,
      conflictingName,
    } = getProperties(file, 'name', 'conflictingName');

    if (conflictingName && name && name.startsWith && name.startsWith(conflictingName)) {
      return conflictingName;
    } else {
      return name || '';
    }
  }),

  /**
   * A conflict suffix of name, if file has one.
   * Eg. '@a1b2c3'
   * @type {ComputedProperty<string>}
   */
  suffix: computed('file.{name,conflictingName}', function suffix() {
    const file = this.get('file');
    if (!file) {
      return null;
    }
    const conflictingName = get(file, 'conflictingName');
    if (!conflictingName) {
      return null;
    }
    const name = get(file, 'name');

    if (
      name === conflictingName ||
      name && name.startsWith && !name.startsWith(conflictingName)
    ) {
      return null;
    } else {
      return name ? name.split(conflictingName)[1] : null;
    }
  }),
});
