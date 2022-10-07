/**
 * Renders details preview of archive audit log entry `logEntry`.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import layout from 'onedata-gui-common/templates/components/audit-log-browser/log-entry-details';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { getArchiveRelativeFilePath, getIsInArchivePath } from 'oneprovider-gui/utils/file-archive-info';
import { directorySeparator } from 'onedata-gui-common/utils/file';

/**
 * @typedef {Object} ArchiveLogEntryDetailsModel
 * @property {string} archiveId
 */

export default Component.extend(I18n, {
  layout,
  classNames: ['log-entry-details', 'archive-log-entry-details'],

  i18n: service(),
  archiveManager: service(),
  store: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveAuditLog.logEntryDetails',

  /**
   * Log entry to show details. This component is visible only if `logEntry` is
   * not empty.
   * @virtual
   * @type {AuditLogEntry<ArchiveAuditLogEntryContent>|undefined}
   */
  logEntry: undefined,

  /**
   * @type {ArchiveLogEntryDetailsModel}
   */
  logEntryDetailsModel: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  absolutePath: reads('logEntry.content.path'),

  /**
   * @type {ComputedProperty<string>}
   */
  fileId: reads('logEntry.content.fileId'),

  /**
   * @type {ComputedProperty<string>}
   */
  archiveId: reads('logEntryDetailsModel.archiveId'),

  /**
   * @type {ComputedProperty<string>}
   */
  relativePath: computed('path', function relativePath() {
    const absolutePath = this.absolutePath;
    if (getIsInArchivePath(absolutePath)) {
      return getArchiveRelativeFilePath(absolutePath);
    } else {
      const sep = directorySeparator;
      return absolutePath.split(sep).slice(2).join(sep);
    }
  }),

  /**
   * A file-pair info without file records resolved.
   * @type {ComputedProperty<PromiseObject<ArchiveFileInfo>>}
   */
  rawFileInfoProxy: promise.object(computed(
    'archiveId',
    'relativePath',
    async function fileInfoProxy() {
      return await this.archiveManager.getFileInfo(this.archiveId, this.relativePath);
    },
  )),

  /**
   * @type {PromiseObject<ArchiveFileInfo>}
   */
  rawFileInfo: reads('rawFileInfoProxy.content'),

  /**
   * @type {ComputedProperty<PromiseObject{ sourceFile: Models.File, archivedFile: Models.File }>>}
   */
  fileInfoProxy: promise.object(computed(
    'rawFileInfo',
    async function fileInfoProxy() {
      const rawFileInfo = await this.rawFileInfoProxy;
      if (!rawFileInfo) {
        return null;
      }
      const sourceFilePromise = this.store.findRecord('file', rawFileInfo.sourceFile);
      const archivedFilePromise = this.store.findRecord('file', rawFileInfo.archivedFile);
      const sourceFile = await sourceFilePromise;
      const archivedFile = await archivedFilePromise;
      return {
        sourceFile,
        archivedFile,
      };
    }
  )),

  /**
   * @type {ComputedProperty<{ sourceFile: Models.File, archivedFile: Models.File }>}
   */
  fileInfo: reads('fileInfoProxy.content'),
});
