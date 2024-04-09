/**
 * Time taken cell of archive audit log.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { htmlSafe } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/i18n';
import { translateFileType } from 'onedata-gui-common/utils/file';

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['cell-time-taken'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveAuditLog.cellTimeTaken',

  /**
   * @virtual
   * @type {ArchiveAuditLogEntryModel}
   */
  entryModel: undefined,

  timeTakenHtml: reads('entryModel.timeTakenHtml'),

  startTimeText: reads('entryModel.startTimeText'),

  /**
   * @type {ComputedProperty<FileType>}
   */
  fileType: reads('entryModel.fileType'),

  tooltipHtml: computed('startTimeText', 'fileType', function tooltipHtml() {
    const fileTypeText = translateFileType(
      this.i18n,
      this.fileType, {
        upperFirst: true,
      }
    );
    return htmlSafe(
      `<strong>${this.t('startedAt', { fileTypeText })}</strong>:<br>${this.startTimeText}`
    );
  }),
});
