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

/**
 * @typedef {'started'|'skipped'|'done'|'failed'|'uknown'} QosLogEntryType
 */

export default Component.extend({
  tagName: 'tr',
  classNames: ['entry-row', 'data-row'],
  classNameBindings: ['severityClass'],
  attributeBindings: ['entry.index:data-row-id'],

  fileManager: service(),
  errorExtractor: service(),
  parentAppNavigation: service(),
  appProxy: service(),

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
   * @type {Object<QosLogEntryType, QosLogStatus>}
   */
  qosLogStatusEnum: Object.freeze({
    started: 'synchronization started',
    skipped: 'synchronization skipped',
    failed: 'synchronization failed',
    done: 'synchronized',
  }),

  statusEntryTypeMapping: Object.freeze({
    'synchronization started': 'started',
    'synchronization skipped': 'skipped',
    'synchronization failed': 'failed',
    'synchronized': 'done',
  }),

  /**
   * @type {Object<QosLogEntryType, FrontendInfiniteLogSeverity>}
   */
  severityMapping: Object.freeze({
    started: 'debug',
    skipped: 'info',
    done: 'success',
    failed: 'error',
    unknown: 'info',
  }),

  qosLogSeverity: reads('entry.content.severity'),

  qosLogStatus: reads('entry.content.status'),

  qosLogReason: reads('entry.content.reason'),

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileCdmiObjectId: reads('entry.content.fileId'),

  /**
   * @type {ComputedProperty<QosLogEntryType>}
   */
  entryType: or(
    getBy('statusEntryTypeMapping', 'qosLogStatus'),
    raw('unknown')
  ),

  /**
   * @type {ComputedProperty<FrontendInfiniteLogSeverity>}
   */
  severity: or(
    getBy('severityMapping', 'entryType'),
    raw('info')
  ),

  severityClass: tag `auditlog-severity-${'severity'}`,

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

  fileNameProxy: promise.object(computed(
    'fileProxy.name',
    async function fileNameProxy() {
      const fileProxy = this.get('fileProxy');
      return get(await fileProxy, 'name');
    }
  )),

  fileName: computedLastProxyContent('fileNameProxy'),

  fileHref: computedPipe('fileId', 'onGenerateFileUrl'),

  /**
   * @type {ComputedProperty<number>}
   */
  timestamp: computed('entry.timestamp', function timestamp() {
    const timestampMs = this.get('entry.timestamp');
    return Number.isInteger(timestampMs) ? timestampMs / 1000 : null;
  }),
});
