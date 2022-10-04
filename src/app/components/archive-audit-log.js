import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-audit-log'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveAuditLog',

  archiveManager: service(),

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  archiveId: reads('archive.entityId'),

  /**
   * @type {ComputedProperty<(listingParams: AuditLogListingParams) => Promise<AuditLogEntriesPage<ArchiveAuditLogEntryContent>>>}
   */
  fetchLogEntriesCallback: computed(
    'archiveId',
    function fetchLogEntriesCallback() {
      return (listingParams) => this.archiveManager.getAuditLog(
        this.archiveId,
        listingParams
      );
    }
  ),

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
});
