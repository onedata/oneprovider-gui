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
import { translateFileType, directorySeparator } from 'onedata-gui-common/utils/file';
import ArchiveAuditLogEntryModel from 'oneprovider-gui/utils/archive-audit-log-entry-model';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import PerfectScrollbarMixin from 'onedata-gui-common/mixins/perfect-scrollbar';

// FIXME: details model may be not needed, because entryModel has archiveId
// FIXME: on the other side - archiveId may be not needed in entryModel

/**
 * @typedef {Object} ArchiveLogEntryDetailsModel
 * @property {string} archiveId
 */

const mixins = [
  I18n,
  PerfectScrollbarMixin,
];

export default Component.extend(...mixins, {
  layout,
  classNames: ['log-entry-details', 'archive-log-entry-details'],

  i18n: service(),
  archiveManager: service(),
  fileManager: service(),

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
  fileId: reads('logEntry.content.fileId'),

  /**
   * @type {ComputedProperty<string>}
   */
  archiveId: reads('logEntryDetailsModel.archiveId'),

  fileName: reads('entryModel.fileName'),

  fileType: reads('entryModel.fileType'),

  /**
   * @type {ComputedProperty<string>}
   */
  absoluteFilePath: reads('entryModel.absoluteFilePath'),

  /**
   * @type {ComputedProperty<string>}
   */
  eventMessage: reads('entryModel.displayedMessage'),

  /**
   * @type {ComputedProperty<Utils.ArchiveAuditLogEntryModel>}
   */
  entryModel: computed('logEntry', 'archiveId', function entryModel() {
    if (!this.logEntry || !this.archiveId) {
      return null;
    }
    return ArchiveAuditLogEntryModel.create({
      ownerSource: this,
      logEntry: this.logEntry,
      archiveId: this.archiveId,
    });
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  relativePath: computed('absoluteFilePath', function relativePath() {
    const sep = directorySeparator;
    // absolute path looks like `/<space_or_archive_dir>/<rest_of_path>`
    return this.absoluteFilePath.split(sep).slice(2).join(sep);
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
   * @type {ComputedProperty<PromiseObject{ sourceFileId: Models.File, archivedFileId: Models.File }>>}
   */
  fileInfoProxy: promise.object(computed(
    'rawFileInfo',
    async function fileInfoProxy() {
      const rawFileInfo = await this.rawFileInfoProxy;
      if (!rawFileInfo) {
        return null;
      }
      const sourceFilePromise = this.fileManager.getFileById(
        rawFileInfo.sourceFileId
      );
      const archivedFilePromise = this.fileManager.getFileById(
        rawFileInfo.archivedFileId
      );
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

  sourceFileAbsolutePathProxy: promise.object(computed(
    'fileInfoProxy',
    async function sourceFileAbsolutePathProxy() {
      const fileInfo = await this.fileInfoProxy;
      const sourceFile = fileInfo?.sourceFile;
      if (!sourceFile) {
        return '';
      }
      return stringifyFilePath(await resolveFilePath(sourceFile));
    }
  )),

  sourceFileAbsolutePath: reads('sourceFileAbsolutePathProxy.content'),

  archivedFileAbsolutePathProxy: promise.object(computed(
    'fileInfoProxy',
    async function sourceFileAbsolutePathProxy() {
      const fileInfo = await this.fileInfoProxy;
      const archivedFile = fileInfo?.archivedFile;
      if (!archivedFile) {
        return '';
      }
      return stringifyFilePath(await resolveFilePath(archivedFile));
    }
  )),

  archivedFileAbsolutePath: reads('archivedFileAbsolutePathProxy.content'),

  fileTypeText: computed('fileType', function fileTypeText() {
    return translateFileType(this.i18n, this.fileType, { upperFirst: true });
  }),

  headerText: computed('fileTypeText', function headerText() {
    return this.t('archivisationEventHeader', {
      fileTypeText: this.fileTypeText,
    });
  }),

  startTimeText: reads('entryModel.startTimeText'),

  endTimeText: reads('entryModel.endTimeText'),

  timeTakenHtml: reads('entryModel.timeTakenHtml'),
});
