/**
 * A container for QoS audit log browser in QoS entry.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise, equal, raw } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import DuplicateNameHashMapper from 'onedata-gui-common/utils/duplicate-name-hash-mapper';
import { getFileNameFromPath } from 'onedata-gui-common/utils/file';

export default Component.extend(I18n, {
  classNames: ['qos-entry-logs'],

  spaceManager: service(),
  qosManager: service(),
  appProxy: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.qosEntryLogs',

  /**
   * @virtual
   * @type {boolean}
   */
  isRendered: false,

  /**
   * @virtual
   * @type {string}
   */
  qosReqiurementId: undefined,

  /**
   * @virtual
   * @type {string}
   */
  fileType: undefined,

  /**
   * @virtual
   * @type {string}
   */
  spaceId: undefined,

  /**
   * If file that logs are about is inside archive, you can provide it here to display
   * archive name in log entries path tooltip.
   * @virtual optional
   * @type {Utils.BrowsabledArchive}
   */
  parentBrowsableArchive: undefined,

  /**
   * Initialized on init.
   * @type {Utils.DuplicateNameHashMapper}
   */
  duplicateNameHashMapper: undefined,

  fileUrlGenerator: computed(function fileUrlGenerator() {
    return new FileUrlGenerator(this.get('appProxy'));
  }),

  isFileColumnVisible: equal('fileType', raw('dir')),

  /**
   * @type {ComputedProperty<PromiseObject<Array<Model.Provider>>>}
   */
  spaceProvidersProxy: promise.object(computed(
    'spaceId',
    async function spaceProvidersProxy() {
      const {
        spaceId,
        spaceManager,
      } = this.getProperties('spaceId', 'spaceManager');

      const space = await spaceManager.getSpace(spaceId);
      const providerList = (await get(await get(space, 'providerList'), 'list'))
        .toArray();

      return providerList;
    }
  )),

  /**
   * @type {ComputedProperty<number>}
   */
  spaceProvidersCount: reads('spaceProvidersProxy.content.length'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  headerTooltip: computed(
    'spaceProvidersCount',
    function headerTooltip() {
      const spaceProvidersCount = this.get('spaceProvidersCount');

      const translationKey = 'headerTooltip.' +
        (spaceProvidersCount > 1 ? 'manyProviders' : 'singleProvider');
      return this.t(translationKey);
    }
  ),

  /**
   * @type {Object<QosLogStatus, string>}
   */
  statusToClassNames: Object.freeze({
    scheduled: 'audit-log-theme-default',
    completed: 'audit-log-theme-success',
  }),

  /**
   * @type {ComputedProperty<Array<AuditLogBrowserCustomColumnHeader>>}
   */
  customColumnHeaders: computed('isFileColumnVisible', function customColumnHeaders() {
    const columns = [];

    if (this.get('isFileColumnVisible')) {
      columns.push({
        classNames: 'file-column-header',
        content: this.t('customColumns.file'),
      });
    }

    columns.push({
      classNames: 'event-column-header',
      content: this.t('customColumns.event'),
    });

    return columns;
  }),

  /**
   * @type {ComputedProperty<(logEntry: AuditLogEntry<QosAuditLogEntryContent>) => string>}
   */
  getClassNamesForLogEntryCallback: computed(
    'statusToClassNames',
    function getClassNamesForLogEntryCallback() {
      const statusToClassNames = this.get('statusToClassNames');
      return (logEntry) => {
        const status = logEntry.content.status;
        if (status in statusToClassNames) {
          return statusToClassNames[status];
        }
      };
    }
  ),

  /**
   * @type {ComputedProperty<(listingParams: AuditLogListingParams) => Promise<AuditLogEntriesPage<QosAuditLogEntryContent>>>}
   */
  fetchLogEntriesCallback: computed(
    'qosRequirementId',
    function fetchLogEntriesCallback() {
      const {
        qosRequirementId,
        qosManager,
      } = this.getProperties(
        'qosRequirementId',
        'qosManager'
      );
      return async (listingParams) => {
        /** @type {AuditLogEntriesPage<QosAuditLogEntryContent>} */
        const logsPage = await qosManager.getAuditLog(
          qosRequirementId,
          listingParams
        );
        for (const entry of logsPage.logEntries) {
          this.registerLogEntry(entry.content);
        }
        return logsPage;
      };
    }
  ),

  init() {
    this._super(...arguments);
    this.set('duplicateNameHashMapper', DuplicateNameHashMapper.create());
  },

  /**
   * @param {QosAuditLogEntryContent} logEntryContent
   * @returns {void}
   */
  registerLogEntry(logEntryContent) {
    const path = logEntryContent.path;
    this.duplicateNameHashMapper.addPair(
      getFileNameFromPath(path),
      path
    );
  },

  actions: {
    /**
     * @param {string} fileId ID of file in archive
     * @returns {string} URL of file in archive
     */
    generateFileUrl(fileId) {
      return this.get('fileUrlGenerator').getUrl(fileId);
    },
  },
});

class FileUrlGenerator {
  constructor(appProxy) {
    this.appProxy = appProxy;
    this.clearCache();
  }
  getUrl(fileId) {
    const cachedUrl = this.cache[fileId];
    if (cachedUrl) {
      return cachedUrl;
    } else {
      this.cache[fileId] = this.generateNewUrl(fileId);
      return this.cache[fileId];
    }
  }
  generateNewUrl(fileId) {
    if (!fileId) {
      return null;
    }
    return this.appProxy.callParent('getDataUrl', {
      selected: [fileId],
    });
  }
  clearCache() {
    this.cache = {};
  }
}
