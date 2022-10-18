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
import isNotFoundError from 'oneprovider-gui/utils/is-not-found-error';

/**
 * @typedef {Object} ArchiveLogEntryDetailsModel
 * @property {string} archiveId
 * @property {(logEntry: AuditLogEntry<ArchiveAuditLogEntryContent>) => Utils.ArchiveAuditLogEntryModel} createEntryModel
 */

/**
 * Provides resolved data about pair of archived and source file for details view.
 * @typedef {Object} ArchiveAuditLogEntryDetailsFileInfo
 * @property {Models.File} archivedFile
 * @property {string} archivedFileId
 * @property {Object|null} archivedFileError
 * @property {Models.File|null} sourceFile
 * @property {string|null} sourceFileId
 * @property {Object|null} sourceFileError
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
  appProxy: service(),
  errorExtractor: service(),

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
      if (!this.relativePath) {
        return null;
      }
      return await this.archiveManager.getFileInfo(this.archiveId, this.relativePath);
    },
  )),

  /**
   * @type {PromiseObject<ArchiveFileInfo>}
   */
  rawFileInfo: reads('rawFileInfoProxy.content'),

  /**
   * @type {ComputedProperty<PromiseObject<ArchiveAuditLogEntryDetailsFileInfo>>}
   */
  fileInfoProxy: promise.object(computed(
    'rawFileInfo',
    async function fileInfoProxy() {
      const rawFileInfo = await this.rawFileInfoProxy;
      if (!rawFileInfo) {
        return null;
      }
      const sourceFilePromise = rawFileInfo.sourceFileId &&
        this.getFile(rawFileInfo.sourceFileId);
      const archivedFilePromise = rawFileInfo.archivedFileId &&
        this.getFile(rawFileInfo.archivedFileId);
      let sourceFile = null;
      let sourceFileError = null;
      let archivedFile = null;
      let archivedFileError = null;
      try {
        sourceFile = await sourceFilePromise;
      } catch (error) {
        sourceFileError = error;
      }
      try {
        archivedFile = await archivedFilePromise;
      } catch (error) {
        archivedFileError = error;
      }
      return {
        archivedFile,
        archivedFileId: rawFileInfo.archivedFileId,
        archivedFileError,
        sourceFile,
        sourceFileId: rawFileInfo.sourceFileId,
        sourceFileError,
      };
    }
  )),

  /**
   * @type {ComputedProperty<ArchiveAuditLogEntryDetailsFileInfo>}
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

  isSourceFileDeleted: computed(
    'fileInfo',
    function isSourceFileDeleted() {
      if (!this.fileInfo) {
        return false;
      }
      return !this.fileInfo.sourceFileId ||
        isNotFoundError(this.fileInfo.sourceFileError);
    }
  ),

  isArchivedFileNotFound: computed(
    'fileInfo',
    function isArchivedFileNotFound() {
      if (!this.fileInfo) {
        return false;
      }
      return !this.fileInfo.archivedFileId ||
        isNotFoundError(this.fileInfo.archivedFileError);
    }
  ),

  sourceFileUrl: computed('fileInfo.sourceFile', function sourceFileUrl() {
    if (!this.fileInfo?.sourceFile) {
      return '';
    }
    return this.appProxy.callParent('getDataUrl', {
      selected: [this.fileInfo.sourceFileId],
    });
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  archivedFileErrorMessage: computed(
    'fileInfo.archivedFileError',
    function archivedFileErrorMessage() {
      const error = this.fileInfo?.archivedFileError;
      if (!error) {
        return '';
      }
      const errorMessage = this.errorExtractor.getMessage(error)?.message ||
        this.t('unknownError');
      return `${this.t('archivedFile.errorPrefix')}: ${errorMessage}`;
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  sourceFileErrorMessage: computed(
    'fileInfo.sourceFileError',
    function sourceFileErrorMessage() {
      const error = this.fileInfo?.sourceFileError;
      if (!error) {
        return '';
      }
      const errorMessage = this.errorExtractor.getMessage(error)?.message ||
        this.t('unknownError');
      return `${this.t('sourceFile.errorPrefix')}: ${errorMessage}`;
    }
  ),

  async getFile(fileId) {
    return this.fileManager.getFileById(fileId);
  },
});
