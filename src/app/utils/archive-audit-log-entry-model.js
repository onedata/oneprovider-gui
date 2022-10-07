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

momentDurationFormatSetup(moment);

export default EmberObject.extend({
  /**
   * Archivisation log entry.
   * @virtual
   * @type {AuditLogEntry<ArchiveAuditLogEntryContent>|undefined}
   */
  logEntry: undefined,

  /**
   * @virtual
   * @type {string}
   */
  archiveId: undefined,

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

  absoluteFilePath: reads('logEntry.content.path'),

  fileType: reads('logEntry.content.fileType'),

  description: reads('logEntry.content.description'),

  fileName: computed('absoluteFilePath', function fileName() {
    return getFileNameFromPath(this.absoluteFilePath);
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedMessage: conditional(
    eq('severity', raw('error')),
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
});
