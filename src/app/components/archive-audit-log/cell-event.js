import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { raw, or, getBy } from 'ember-awesome-macros';

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

  icon: or(
    getBy('severityToIconMapping', 'severity'),
    raw('browser-info')
  ),
});
