/**
 * Splits file name and suffix if there is a file name conflict
 * 
 * @module utils/file-name-parser
 * @author Jakub Liput
 * @copyright (C) 2020-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, getProperties } from '@ember/object';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * An original file name without prefix.
   * Eg. 'hello.txt'
   * @type {ComputedProperty<String>}
   */
  base: computed('file.{name,index}', function base() {
    const file = this.get('file');
    if (!file) {
      return '';
    }
    const {
      name,
      index,
    } = getProperties(file, 'name', 'index');

    if (name && name.startsWith && name.startsWith(index)) {
      return index;
    } else {
      return name || '';
    }
  }),

  /**
   * A conflict suffix of name, if file has one.
   * Eg. '@a1b2c3'
   * @type {ComputedProperty<String>}
   */
  suffix: computed('file.{name,index}', function fileNameSuffix() {
    const file = this.get('file');
    if (!file) {
      return null;
    }
    const {
      name,
      index,
    } = getProperties(file, 'name', 'index');
    if (name === index || name && name.startsWith && !name.startsWith(index)) {
      return null;
    } else {
      return name ? name.split(index)[1] : null;
    }
  }),
});
