/**
 * Shows stringified recall error.
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import createErrorMessageSpec from 'oneprovider-gui/utils/create-error-message-spec';
import { equal, raw, or, and } from 'ember-awesome-macros';

export default Component.extend({
  tagName: 'td',

  errorExtractor: service(),

  /**
   * @virtual
   * @type {RecallError}
   */
  reason: undefined,

  /**
   * @type {ComputedProperty<ErrorMessageSpec>}
   */
  errorInfo: computed('reason', function errorInfo() {
    const {
      reason,
      errorExtractor,
    } = this.getProperties('reason', 'errorExtractor');
    return createErrorMessageSpec(reason, errorExtractor);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  message: or('errorInfo.message', raw('–')),

  /**
   * @type {ComputedProperty<string>}
   */
  messageClass: or(
    and(
      equal('errorInfo.type', raw('raw')),
      raw('monospace-font')
    ),
    raw(''),
  ),
});
