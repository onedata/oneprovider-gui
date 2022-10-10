// FIXME: jsdoc

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ArchiveAuditLogEntryModel from 'oneprovider-gui/utils/archive-audit-log-entry-model';
import { promise } from 'ember-awesome-macros';
import isNotFoundError from 'oneprovider-gui/utils/is-not-found-error';
import { htmlSafe } from '@ember/string';
import _ from 'lodash';

export default Component.extend(I18n, {
  archiveManager: service(),
  appProxy: service(),

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

  /**
   * A flag set to true when fetching archive logs ends with not found error - it
   * typically occurs when the archive was not created on current provider and logs are
   * availalbe only on creating provider.
   * @type {boolean}
   */
  hasNotFoundErrorOccured: false,

  archiveId: reads('archive.entityId'),

  /**
   * @type {ComputedProperty<(listingParams: AuditLogListingParams) => Promise<AuditLogEntriesPage<ArchiveAuditLogEntryContent>>>}
   */
  fetchLogEntriesCallback: computed(
    'archiveId',
    function fetchLogEntriesCallback() {
      return async (listingParams) => {
        try {
          const result = await this.archiveManager.getAuditLog(
            this.archiveId,
            listingParams
          );
          if (this.hasNotFoundErrorOccured) {
            this.set('hasNotFoundErrorOccured');
          }
          return result;
        } catch (error) {
          if (error) {
            if (isNotFoundError(error)) {
              this.set('hasNotFoundErrorOccured', true);
            }
          }
          throw error;
        }
      };
    }
  ),

  noLogEntriesTextProxy: promise.object(computed(
    'hasNotFoundErrorOccured',
    async function noLogEntriesTextProxy() {
      if (this.hasNotFoundErrorOccured) {
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

  // FIXME: new API will conatain provider in archive record
  async getArchiveProvider() {
    const rootDir = await get(this.archive, 'rootDir');
    return get(rootDir, 'provider');
  },

  actions: {
    createEntryModel(logEntry) {
      return this.createEntryModel(logEntry);
    },
  },
});
