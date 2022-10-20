/**
 * Cell of archive audit log entry presenting archivised file basic info.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import filePathViewCreateRelative from 'oneprovider-gui/utils/file-path-view/create-relative';

export default Component.extend({
  tagName: 'td',
  classNames: ['cell-file'],

  errorExtractor: service(),

  /**
   * @virtual
   * @type {Utils.ArchiveAuditLogEntryModel}
   */
  entryModel: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  absoluteFilePath: reads('entryModel.absoluteFilePath'),

  /**
   * @type {ComputedProperty<FileType>}
   */
  fileType: reads('entryModel.fileType'),

  /**
   * @type {ComputedProperty<string>}
   */
  fileName: reads('entryModel.fileName'),

  /**
   *  @returns {Array<FilePathItem>}
   */
  pathItems: computed('entryModel.relativePath', function pathItems() {
    if (!this.entryModel.relativePath) {
      return [];
    }
    // presenting only relative path, removing leading slash
    return filePathViewCreateRelative(this.entryModel.relativePath);
  }),
});
