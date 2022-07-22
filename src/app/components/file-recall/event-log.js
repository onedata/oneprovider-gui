/**
 * Infinite scroll table with events (currently only errors) of recall process.
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['file-recall-event-log'],

  fileManager: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall.eventLog',

  /**
   * @virtual
   * @type {Models.File}
   */
  recallRootFile: undefined,

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  recallRootFileId: reads('recallRootFile.entityId'),

  archiveId: reads('archive.entityId'),

  datasetId: reads('dataset.entityId'),

  /**
   * @type {ComputedProperty<Array<AuditLogBrowserCustomColumnHeader>>}
   */
  customColumnHeaders: computed('isFileColumnVisible', function customColumnHeaders() {
    return [{
      classNames: 'file-column-header',
      content: this.t('customColumns.sourceFile'),
    }, {
      classNames: 'error-column-header',
      content: this.t('customColumns.errorMessage'),
    }];
  }),

  /**
   * @type {ComputedProperty<(listingParams: AuditLogListingParams) => Promise<AuditLogEntriesPage<RecallAuditLogEntryContent>>>}
   */
  fetchLogEntriesCallback: computed(
    'recallRootFileId',
    function fetchLogEntriesCallback() {
      const {
        recallRootFileId,
        fileManager,
      } = this.getProperties(
        'recallRootFileId',
        'fileManager'
      );
      return (listingParams) => fileManager.getRecallLogs(
        recallRootFileId,
        listingParams
      );
    }
  ),

  /**
   * @param {string} fileId ID of file in archive
   * @returns {string} URL of file in archive
   */
  generateSourceFileUrl(fileId) {
    const {
      appProxy,
      archiveId,
      datasetId,
    } = this.getProperties('appProxy', 'archiveId', 'datasetId');
    if (!archiveId || !datasetId) {
      return null;
    }
    return appProxy.callParent('getDatasetsUrl', {
      selectedDatasets: [datasetId],
      archive: archiveId,
      selectedFiles: [fileId],
    });
  },

  actions: {
    generateSourceFileUrl(fileId) {
      return this.generateSourceFileUrl(fileId);
    },
  },
});
