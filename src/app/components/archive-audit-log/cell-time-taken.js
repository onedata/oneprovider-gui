import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { htmlSafe } from '@ember/string';
import { detailedReportFormatter } from 'onedata-gui-common/helpers/date-format';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { translateFileType } from 'onedata-gui-common/utils/file';

momentDurationFormatSetup(moment);

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['cell-time-taken'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveAuditLog.cellTimeTaken',

  /**
   * Milliseconds timestamp of file archivisation start.
   * @virtual
   * @type {number}
   */
  startTimeMs: undefined,

  /**
   * Milliseconds timestamp of file archivisation end (which means both successful
   * archivisation or end with error).
   * @virtual
   * @type {number}
   */
  endTimeMs: undefined,

  /**
   * @virtual
   * @type {FileType}
   */
  fileType: undefined,

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
  startTimeFormatted: computed('startTimeMs', function startTimeFormatted() {
    return moment(this.startTimeMs).format(detailedReportFormatter);
  }),

  tooltipHtml: computed('startTimeFormatted', 'fileType', function tooltipHtml() {
    const fileTypeText = translateFileType(
      this.i18n,
      this.fileType, {
        upperFirst: true,
      }
    );
    return htmlSafe(
      `<strong>${this.t('startedAt', { fileTypeText })}</strong>:<br>${this.startTimeFormatted}`
    );
  }),
});
