import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { getFileNameFromPath } from 'onedata-gui-common/utils/file';
import { conditional, eq, raw } from 'ember-awesome-macros';
import _ from 'lodash';
import { detailedReportFormatter } from 'onedata-gui-common/helpers/date-format';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { htmlSafe } from '@ember/string';
import parseLogError from 'oneprovider-gui/utils/create-error-message-spec';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { directorySeparator } from 'onedata-gui-common/utils/file';

momentDurationFormatSetup(moment);

const mixins = [
  OwnerInjector,
];

export default EmberObject.extend(...mixins, {
  errorExtractor: service(),

  /**
   * Archivisation log entry.
   * @virtual
   * @type {AuditLogEntry<ArchiveAuditLogEntryContent>|undefined}
   */
  logEntry: undefined,

  /**
   * @virtual
   * @type {Utils.BrowsableDataset}
   */
  browsableDataset: undefined,

  spaceName: reads('space.name'),

  /**
   * Milliseconds timestamp of file archivisation start.
   * @type {ComputedProperty<number>}
   */
  startTimeMs: reads('logEntry.content.startTimestamp'),

  /**
   * Milliseconds timestamp of file archivisation event ocurred (success of failure).
   * @type {ComputedProperty<number>}
   */
  endTimeMs: reads('logEntry.timestamp'),

  /**
   * Can be one of:
   * 1. absolute path to source file from space root dir,
   * 2. path to archived file, where first dir is archive root dir (eg. archive_12345678).
   *
   * Type of path is determined in `isArchivedFilePath`
   * @type {ComputedProperty<string>}
   */
  absoluteFilePath: reads('logEntry.content.path'),

  fileType: reads('logEntry.content.fileType'),

  description: reads('logEntry.content.description'),

  reason: reads('logEntry.content.reason'),

  severity: reads('logEntry.severity'),

  datasetRootPath: reads('browsableDataset.rootFilePath'),

  fileName: computed('absoluteFilePath', function fileName() {
    return getFileNameFromPath(this.absoluteFilePath);
  }),

  isError: eq('severity', raw('error')),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedMessage: conditional(
    'isError',
    computed('description', 'errorInfo', function displayedMessage() {
      const errorInfoText =
        _.upperFirst(this.errorInfo?.message);
      let text = this.description;
      if (errorInfoText) {
        text += ` ${errorInfoText}`;
      }
      if (!text.endsWith('.')) {
        text += '.';
      }
      return text;
    }),
    'description',
  ),

  /**
   * @type {ComputedProperty<ErrorMessageSpec|null>}
   */
  errorInfo: computed('reason', function errorInfo() {
    const {
      reason,
      errorExtractor,
    } = this.getProperties('reason', 'errorExtractor');
    if (!reason || typeof reason === 'string') {
      return null;
    }
    return parseLogError(reason, errorExtractor);
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  timeTakenHtml: computed('startTimeMs', 'endTimeMs', function timeTakenHtml() {
    if (!this.startTimeMs || !this.endTimeMs) {
      return '–';
    }
    const effDurationMs = this.endTimeMs - this.startTimeMs;

    let template;
    let precision = 0;
    if (effDurationMs < 1000) {
      template = 'S[<span class="unit">ms</span>]';
    } else {
      template =
        'd[<span class="unit">days</span>] h[<span class="unit">h</span>] m[<span class="unit">mins</span>] s[<span class="unit">s</span>]';
      if (effDurationMs < 60000) {
        precision = 3;
      }
    }
    const duration = moment.duration(effDurationMs, 'ms');

    const resultString = duration.format({ template, precision }, {
      trim: 'both final',
    });
    return htmlSafe(resultString);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  startTimeText: computed('startTimeMs', function startTimeText() {
    return moment(this.startTimeMs).format(detailedReportFormatter);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  endTimeText: computed('endTimeMs', function endTimeText() {
    return moment(this.endTimeMs).format(detailedReportFormatter);
  }),

  /**
   * Relative path to file from dataset root.
   * @type {ComputedProperty<string>}
   */
  relativePath: computed(
    'absoluteFilePath',
    'datasetRootPath',
    function relativePath() {
      const sep = directorySeparator;
      const datasetRootParentPath =
        this.datasetRootPath.split(sep).slice(0, -1).join(sep);
      if (this.isAbsolutePathFromArchive) {
        // first item after split is '' (because of leading separator)
        // second is effectively first dir in path (in this case: archive root)
        return this.absoluteFilePath.split(sep).slice(2).join(sep);
      } else {
        return this.absoluteFilePath
          .replace(new RegExp(`^${datasetRootParentPath}${sep}`), '');
      }
    }
  ),

  /**
   * Returns true if path data from the event has its root in archive (not space).
   * @returns {boolean}
   */
  isAbsolutePathFromArchive: computed(
    'description',
    function isAbsolutePathFromArchive() {
      return /verification failed/.test(this.description);
    }
  ),
});
