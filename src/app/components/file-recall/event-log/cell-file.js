/**
 * Shows recall log source file.
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import { inject as service } from '@ember/service';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import filePathViewCreateRelative from 'oneprovider-gui/utils/file-path-view/create-relative';

export default Component.extend({
  tagName: 'td',
  classNames: ['cell-file'],

  parentAppNavigation: service(),

  /**
   * @virtual
   * @type {string}
   */
  fileCdmiObjectId: undefined,

  /**
   * @virtual
   * @type {string}
   */
  relativePath: undefined,

  /**
   * Should generate a full source file URL inside archive.
   * @virtual
   * @type {(fileId: string) => string}
   */
  onGenerateSourceFileUrl: notImplementedIgnore,

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileId: computedPipe('fileCdmiObjectId', cdmiObjectIdToGuid),

  fileName: computed('relativePath', function fileName() {
    const relativePath = this.get('relativePath');
    if (!relativePath || typeof relativePath !== 'string') {
      return;
    }
    const pathArray = relativePath.split('/');
    return pathArray[pathArray.length - 1];
  }),

  fileHref: computedPipe('fileId', 'onGenerateSourceFileUrl'),

  // FIXME: DRY?
  fileNameHash: computed(
    'relativePath',
    // FIXME: add property
    'duplicateNameHashMapper.hashMapping',
    function fileNameHash() {
      const hashMapping = this.duplicateNameHashMapper.hashMapping;
      // debugger;
      if (!this.relativePath) {
        return '';
      }
      const hash = hashMapping[this.relativePath];
      return hash ? ('#' + hash) : '';
    }
  ),

  /**
   *  @returns {Array<FilePathItem>}
   */
  pathItems: computed('relativePath', function pathItems() {
    if (!this.relativePath) {
      return [];
    }
    // presenting only relative path, removing leading slash
    return filePathViewCreateRelative(this.relativePath);
  }),
});
