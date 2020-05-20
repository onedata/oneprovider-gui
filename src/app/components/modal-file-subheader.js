/**
 * Subheader for file-operation modals with file name 
 * 
 * @module components/modal-file-subheader
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { gt, conditional, raw, or, and, eq } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FileNameParser from 'oneprovider-gui/utils/file-name-parser';

export default Component.extend(I18n, {
  tagName: 'h2',
  classNames: ['modal-file-subheader', 'filename', 'normal-case'],

  /**
   * @override
   */
  i18nPrefix: 'components.modalFileSubheader',

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual optional
   * @type {String}
   */
  multiTextPrefix: undefined,

  filesCount: reads('files.length'),

  firstFile: reads('files.firstObject'),

  fileNameBase: reads('fileNameParser.base'),

  fileNameSuffix: reads('fileNameParser.suffix'),

  multi: gt('filesCount', 1),

  type: conditional(
    'multi',
    raw('multi'),
    'firstFile.type'
  ),

  fileNameParser: computed('firstFile', function fileNameParser() {
    const firstFile = this.get('firstFile');
    if (firstFile) {
      return FileNameParser.create({ file: firstFile });
    }
  }),

  icon: or(
    and(eq('type', raw('file')), raw('browser-file')),
    and(eq('type', raw('dir')), raw('browser-directory')),
    null
  ),
});
