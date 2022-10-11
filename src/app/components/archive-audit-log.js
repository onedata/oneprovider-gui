// FIXME: jsdoc

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ArchiveAuditLogEntryModel from 'oneprovider-gui/utils/archive-audit-log-entry-model';
import { promise, conditional, raw } from 'ember-awesome-macros';
import { htmlSafe } from '@ember/string';
import _ from 'lodash';

export default Component.extend(I18n, {
  archiveManager: service(),
  appProxy: service(),
  providerManager: service(),

  classNames: ['archive-audit-log'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveAuditLog',

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  archiveId: reads('archive.entityId'),

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
    'archive.provider',
    function areLogsOnCurrentProvider() {
      const currentProviderId = this.providerManager.getCurrentProviderId();
      const archiveProviderId = this.archive.relationEntityId('provider');
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
  customColumnHeaders: computed(function customColumnHeaders() {
    return [{
      classNames: 'file-column-header',
      content: this.t('customColumns.file'),
    }, {
      classNames: 'event-column-header',
      content: this.t('customColumns.event'),
    }, {
      classNames: 'time-taken-column-header',
      content: this.t('customColumns.timeTaken'),
    }];
  }),

  /**
   * @type {ComputedProperty<ArchiveLogEntryDetailsModel>}
   */
  logEntryDetailsModel: computed('archiveId', function logEntryDetailsModel() {
    return { archiveId: this.archiveId };
  }),

  /**
   * @param {AuditLogEntry<ArchiveAuditLogEntryContent>} logEntry
   * @returns {Utils.ArchiveAuditLogEntryModel}
   */
  createEntryModel(logEntry) {
    return ArchiveAuditLogEntryModel.create({
      ownerSource: this,
      logEntry,
      archiveId: this.archiveId,
    });
  },

  async getArchiveProvider() {
    return await get(this.archive, 'provider');
  },

  actions: {
    createEntryModel(logEntry) {
      return this.createEntryModel(logEntry);
    },
  },
});
