/**
 * A large file/directory icon with basic file information for use mainly in modals
 * 
 * @module components/single-file-info
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, equal, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  classNames: ['row', 'row-single-file-info', 'single-file-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.singleFileInfo',

  /**
   * @type {Models.File}
   */
  file: undefined,

  fileName: reads('file.name'),

  fileSize: reads('file.size'),

  fileIcon: conditional(
    equal('file.type', raw('dir')),
    raw('browser-directory'),
    raw('browser-file')
  ),
});
