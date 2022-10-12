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
import { promise, conditional, raw } from 'ember-awesome-macros';
import { translateFileType } from 'onedata-gui-common/utils/file';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import PerfectScrollbarMixin from 'onedata-gui-common/mixins/perfect-scrollbar';

// FIXME: details model may be not needed, because entryModel has archiveId
// FIXME: on the other side - archiveId may be not needed in entryModel

/**
 * @typedef {Object} ArchiveLogEntryDetailsModel
 * @property {string} archiveId
 * @property {(logEntry: AuditLogEntry<ArchiveAuditLogEntryContent>) => Utils.ArchiveAuditLogEntryModel} createEntryModel
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

  fileName: reads('entryModel.fileName'),

  archivedFileType: reads('entryModel.fileType'),

  /**
   * @type {ComputedProperty<string>}
   */
  eventMessage: reads('entryModel.displayedMessage'),

  /**
   * @type {ComputedProperty<Utils.ArchiveAuditLogEntryModel>}
   */
  entryModel: computed('logEntry', function entryModel() {
    if (!this.logEntry) {
      return null;
    }
    return this.logEntryDetailsModel.createEntryModel(this.logEntry);
  }),

  relativePath: reads('entryModel.relativePath'),

  archiveId: reads('logEntryDetailsModel.archiveId'),

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

  sourceFileType: reads('fileInfo.sourceFile.type'),

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

  archivedFileTypeText: computed('archivedFileType', function archivedFileTypeText() {
    return translateFileType(this.i18n, this.archivedFileType, { upperFirst: true });
  }),

  sourceFileTypeText: computed('sourceFileType', function sourceFileTypeText() {
    return translateFileType(this.i18n, this.sourceFileType, { upperFirst: true });
  }),

  headerText: computed('archivedFileTypeText', function headerText() {
    return this.t('archivisationEventHeader', {
      fileTypeText: this.archivedFileTypeText,
    });
  }),

  startTimeText: reads('entryModel.startTimeText'),

  endTimeText: reads('entryModel.endTimeText'),

  timeTakenHtml: reads('entryModel.timeTakenHtml'),

  eventMessageClass: conditional(
    'entryModel.isError',
    raw('text-danger'),
    raw(''),
  ),
});
