/**
 * Detects if file record have suffix (see FileNameParser) and if so, renders
 * the name with it. Otherwise, renders only the name.
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['file-name-conflict'],
  tagName: 'span',

  fileNameParser: computed('file', function fileNameParser() {
    const file = this.get('file');
    if (file) {
      return FileNameParser.create({ file });
    }
  }),

  fileNameBase: reads('fileNameParser.base'),

  fileNameSuffix: reads('fileNameParser.suffix'),
});
