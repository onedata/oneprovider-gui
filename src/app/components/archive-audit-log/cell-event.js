/**
 * Cell of archive audit log entry presenting archivisation event message.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: 'td',
  classNames: ['cell-event'],

  errorExtractor: service(),

  /**
   * @virtual
   * @type {Utils.ArchiveAuditLogEntryModel}
   */
  entryModel: undefined,

  severityToIconMapping: Object.freeze({
    info: 'checkbox-filled',
    error: 'checkbox-filled-x',
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedMessage: reads('entryModel.displayedMessage'),

  /**
   * @type {ComputedProperty<AuditLogEntrySeverity>}
   */
  severity: reads('entryModel.severity'),

  icon: computed('severityToIconMapping', 'severity', function icon() {
    return this.severityToIconMapping?.[this.severity] ?? 'browser-info';
  }),
});
