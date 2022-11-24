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
import computedFileNameHash from 'oneprovider-gui/utils/computed-file-name-hash';

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
   * @virtual
   * @type {Utils.DuplicateNameHashMapper}
   */
  duplicateNameHashMapper: undefined,

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

  /**
   * @type {ComputedProperty<string>}
   */
  fileNameHash: computedFileNameHash('relativePath'),

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
