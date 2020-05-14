/**
 * Splits file name and suffix if there is a file name conflict
 * 
 * @module utils/file-name-parser
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';

export default EmberObject.extend({
  /**
   * @virtual
   */
  file: undefined,

  base: reads('file.index'),

  suffix: computed('file.{name,index}', function fileNameSuffix() {
    const file = this.get('file');
    const {
      name,
      index,
    } = getProperties(file, 'name', 'index');
    if (name === index) {
      return null;
    } else {
      return name.split(index)[1];
    }
  }),
});
