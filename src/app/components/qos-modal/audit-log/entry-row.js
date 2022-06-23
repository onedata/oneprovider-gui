/**
 * Row of QoS audit log infinite scroll table.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import { inject as service } from '@ember/service';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import { promise, tag } from 'ember-awesome-macros';
import { and, or, getBy, raw } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['entry-row', 'data-row'],
  classNameBindings: ['severityClass'],
  attributeBindings: ['entry.index:data-row-id'],

  fileManager: service(),
  errorExtractor: service(),
  parentAppNavigation: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.auditLog.entryRow',

  /**
   * @virtual
   * @type {QosLogEntry}
   */
  entry: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  showFileColumn: undefined,

  /**
   * Should generate a full file URL.
   * @virtual
   * @type {(fileId: string) => string}
   */
  onGenerateFileUrl: notImplementedIgnore,

  /**
   * @type {Object<QosLogEntryType, FrontendInfiniteLogSeverity>}
   */
  statusToSeverityMapping: Object.freeze({
    scheduled: 'debug',
    skipped: 'info',
    completed: 'success',
    failed: 'error',
  }),

  /**
   * @type {ComputedProperty<QosLogSeverity>}
   */
  qosLogSeverity: reads('entry.content.severity'),

  /**
   * @type {ComputedProperty<QosLogStatus>}
   */
  qosLogStatus: reads('entry.content.status'),

  /**
   * @type {ComputedProperty<QosLogErrorReason>}
   */
  qosLogReason: reads('entry.content.reason'),

  /**
   * @type {ComputedProperty<string>}
   */
  qosLogDescription: reads('entry.content.description'),

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileCdmiObjectId: reads('entry.content.fileId'),

  /**
   * Overriden severity of log entry to enable context-colorizing.
   * @type {ComputedProperty<FrontendInfiniteLogSeverity>}
   */
  entrySeverity: or(
    getBy('statusToSeverityMapping', 'qosLogStatus'),
    raw('info')
  ),

  severityClass: tag`auditlog-severity-${'entrySeverity'}`,

  fileId: and(
    'fileCdmiObjectId',
    computedPipe('fileCdmiObjectId', cdmiObjectIdToGuid)
  ),

  /**
   * Note: does not depend on fileId changes to prevent recomputations
   * @type {ComputedProperty<PromiseObject<Models.File>>}
   */
  fileProxy: promise.object(computed(async function fileProxy() {
    const {
      fileManager,
      fileId,
    } = this.getProperties('fileManager', 'fileId');
    return fileManager.getFileById(fileId);
  })),

  fileInfoProxy: promise.object(computed(
    'fileId',
    'fileProxy.name',
    async function fileNameProxy() {
      const {
        fileProxy,
        fileId,
        onGenerateFileUrl,
      } = this.getProperties(
        'fileProxy',
        'fileId',
        'onGenerateFileUrl',
      );
      let name;
      let href;
      let className;
      try {
        const file = await fileProxy;
        name = get(file, 'name');
        try {
          href = onGenerateFileUrl(fileId);
        } catch (error) {
          href = null;
        }
      } catch (error) {
        name = this.t('fileNotAvailable');
        className = 'file-not-available';
      }
      return {
        name,
        href,
        className,
      };
    }
  )),

  fileInfo: computedLastProxyContent('fileInfoProxy'),

  /**
   * @type {ComputedProperty<number>}
   */
  timestamp: computed('entry.timestamp', function timestamp() {
    const timestampMs = this.get('entry.timestamp');
    return Number.isInteger(timestampMs) ? timestampMs / 1000 : null;
  }),
});
