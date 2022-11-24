/**
 * Content of table cell with file from QoS audit log.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { and, bool, promise } from 'ember-awesome-macros';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import computedFileNameHash from 'oneprovider-gui/utils/computed-file-name-hash';
import { getFileNameFromPath } from 'onedata-gui-common/utils/file';

export default Component.extend({
  tagName: 'td',
  classNames: ['cell-file'],

  fileManager: service(),
  parentAppNavigation: service(),

  /**
   * @virtual
   * @type {string}
   */
  fileCdmiObjectId: undefined,

  /**
   * Absolute file path.
   * @virtual
   * @type {string}
   */
  path: undefined,

  /**
   * @virtual
   * @type {Utils.DuplicateNameHashMapper}
   */
  duplicateNameHashMapper: undefined,

  /**
   * Should generate a full file URL.
   * @virtual
   * @type {(fileId: string) => string}
   */
  onGenerateFileUrl: undefined,

  /**
   * If file that logs are about is inside archive, you can provide it here to display
   * archive name in log entries path tooltip.
   * @virtual optional
   * @type {Utils.BrowsabledArchive}
   */
  parentBrowsableArchive: undefined,

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileId: and(
    'fileCdmiObjectId',
    computedPipe('fileCdmiObjectId', cdmiObjectIdToGuid)
  ),

  fileProxy: promise.object(computed('fileId', async function fileProxy() {
    if (!this.fileId) {
      return null;
    }
    return await this.fileManager.getFileById(this.fileId);
  })),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isFileAccessible: bool('fileProxy.content'),

  href: computed('onGenerateFileUrl', 'fileId', function href() {
    return this.onGenerateFileUrl(this.fileId);
  }),

  fileName: computed('path', function fileName() {
    return getFileNameFromPath(this.path);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  fileNameHash: computedFileNameHash('path'),
});
