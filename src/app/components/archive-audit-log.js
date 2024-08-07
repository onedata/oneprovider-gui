/**
 * Audit log of archivisation for single archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import ArchiveAuditLogEntryModel from 'oneprovider-gui/utils/archive-audit-log-entry-model';
import { promise, conditional, raw } from 'ember-awesome-macros';
import { htmlSafe } from '@ember/string';
import _ from 'lodash';
import DuplicateNameHashMapper from 'onedata-gui-common/utils/duplicate-name-hash-mapper';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';

export default Component.extend(I18n, {
  archiveManager: service(),
  datasetManager: service(),
  appProxy: service(),
  providerManager: service(),
  media: service(),

  classNames: ['archive-audit-log'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveAuditLog',

  /**
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  browsableArchive: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * Initialized on init.
   * @type {Utils.DuplicateNameHashMapper}
   */
  duplicateNameHashMapper: undefined,

  /**
   * @type {Map<AuditLogEntry<ArchiveAuditLogEntryContent>, Utils.ArchiveAuditLogEntryModel>}
   */
  entryModelsCache: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<Utils.BrowsableDataset>>}
   */
  browsableDatasetProxy: promise.object(computed(
    'browsableArchive',
    async function browsableDatasetProxy() {
      const datasetId = this.browsableArchive.relationEntityId('dataset');
      return await this.datasetManager.getBrowsableDataset(datasetId);
    }
  )),

  browsableDataset: reads('browsableDatasetProxy.content'),

  archiveId: reads('browsableArchive.entityId'),

  /**
   * @type {InfiniteScrollTableUpdateStrategy}
   */
  updateStrategy: conditional(
    'areLogsOnCurrentProvider',
    raw('onTop'),
    raw('never')
  ),

  /**
   * @type {ComputedProperty<(listingParams: AuditLogListingParams) => Promise<AuditLogEntriesPage<ArchiveAuditLogEntryContent>>>}
   */
  fetchLogEntriesCallback: computed(
    'archiveId',
    function fetchLogEntriesCallback() {
      return async (listingParams) => this.archiveManager.getAuditLog(
        this.archiveId,
        listingParams
      );
    }
  ),

  areLogsOnCurrentProvider: computed(
    'browsableArchive.provider',
    function areLogsOnCurrentProvider() {
      const currentProviderId = this.providerManager.getCurrentProviderId();
      const archiveProviderId = this.browsableArchive.relationEntityId('provider');
      if (!currentProviderId || !archiveProviderId) {
        return false;
      }
      return currentProviderId === archiveProviderId;
    }
  ),

  noLogEntriesTextProxy: promise.object(computed(
    'areLogsOnCurrentProvider',
    async function noLogEntriesTextProxy() {
      if (!this.areLogsOnCurrentProvider) {
        const provider = await this.getArchiveProvider();
        const providerId = _.escape(get(provider, 'entityId'));
        const providerName = _.escape(get(provider, 'name'));
        const providerUrl = _.escape(this.appProxy.callParent('getDataUrl', {
          oneproviderId: providerId,
        }, {
          preserveCurrentOptions: true,
        }));
        return htmlSafe(
          `<p>${this.t('noLogs.notOnCurrentProvider')}</p>` +
          `<p>${this.t('noLogs.visitPrefix')} ` +
          `<a href="${providerUrl}" class="navy underlined" target="_top">${providerName}</a>` +
          ` ${this.t('noLogs.visitSuffix')}</p>`
        );
      } else {
        return '';
      }
    }
  )),

  noLogEntriesText: reads('noLogEntriesTextProxy.content'),

  /**
   * @type {ComputedProperty<Array<AuditLogBrowserCustomColumnHeader>>}
   */
  customColumnHeaders: computed('media.isMobile', function customColumnHeaders() {
    const headers = [{
      classNames: 'file-column-header',
      content: this.t('customColumns.file'),
    }, {
      classNames: 'event-column-header',
      content: this.t('customColumns.event'),
    }];
    if (!this.media.isMobile) {
      headers.push({
        classNames: 'time-taken-column-header',
        content: this.t('customColumns.timeTaken'),
      });
    }
    return headers;
  }),

  /**
   * @type {ComputedProperty<ArchiveLogEntryDetailsConfiguration>}
   */
  logEntryDetailsConfiguration: computed(
    'archiveId',
    function logEntryDetailsConfiguration() {
      return {
        archiveId: this.archiveId,
        createEntryModel: this.createEntryModel.bind(this),
      };
    }
  ),

  init() {
    this._super(...arguments);
    this.set('entryModelsCache', new Map());
    this.set('duplicateNameHashMapper', DuplicateNameHashMapper.create());
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.entryModelsCache?.forEach(entryModel => entryModel?.destroy());
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @param {AuditLogEntry<ArchiveAuditLogEntryContent>} logEntry
   * @returns {Utils.ArchiveAuditLogEntryModel}
   */
  createEntryModel(logEntry) {
    return ArchiveAuditLogEntryModel.create({
      ownerSource: this,
      logEntry,
      browsableDataset: this.browsableDataset,
      duplicateNameHashMapper: this.duplicateNameHashMapper,
    });
  },

  async getArchiveProvider() {
    return await get(this.browsableArchive, 'provider');
  },

  /**
   * @param {Utils.ArchiveAuditLogEntryModel} entryModel
   */
  registerLogEntry(entryModel) {
    this.entryModelsCache.set(entryModel.logEntry, entryModel);
    this.duplicateNameHashMapper.addPair(
      entryModel.fileName,
      entryModel.relativePath
    );
  },

  actions: {
    createEntryModelForRow(logEntry) {
      const cached = this.entryModelsCache.get(logEntry);
      if (cached) {
        return cached;
      }
      const entryModel = this.createEntryModel(logEntry);
      // MUST NOT be invoked within current render, because it modified template data
      (async () => {
        await waitForRender();
        this.registerLogEntry(entryModel);
      })();
      return entryModel;
    },
  },
});
