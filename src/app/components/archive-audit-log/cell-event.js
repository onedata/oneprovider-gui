import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import parseLogError from 'oneprovider-gui/utils/create-error-message-spec';
import { raw, or, getBy } from 'ember-awesome-macros';

export default Component.extend({
  tagName: 'td',
  classNames: ['cell-event'],

  errorExtractor: service(),

  /**
   * @virtual
   * @type {AuditLogEntrySeverity}
   */
  severity: undefined,

  /**
   * @virtual
   * @type {string}
   */
  description: undefined,

  /**
   * @virtual
   * @type {Object}
   */
  reason: undefined,

  severityToIconMapping: Object.freeze({
    info: 'checkbox-filled',
    error: 'checkbox-filled-x',
  }),

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
  displayedMessage: reads('entryModel.displayedMessage'),

  icon: or(
    getBy('severityToIconMapping', 'severity'),
    raw('browser-info')
  ),
});
