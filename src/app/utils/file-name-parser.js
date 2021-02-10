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
   */
  file: undefined,

  base: computed('file.{name,index}', function base() {
    const {
      name,
      index,
    } = getProperties(this.get('file'), 'name', 'index');

    if (name && name.startsWith && name.startsWith(index)) {
      return index;
    } else {
      return name;
    }
  }),

  suffix: computed('file.{name,index}', function fileNameSuffix() {
    const file = this.get('file');
    const {
      name,
      index,
    } = getProperties(file, 'name', 'index');
    if (name === index || name && name.startsWith && !name.startsWith(index)) {
      return null;
    } else {
      return name.split(index)[1];
    }
  }),
});
