import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import parseLogError from 'oneprovider-gui/utils/create-error-message-spec';
import { raw, eq, conditional, or, getBy } from 'ember-awesome-macros';
import _ from 'lodash';

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
    info: 'browser-info',
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

  icon: or(
    getBy('severityToIconMapping', 'severity'),
    raw('browser-info')
  ),
});
