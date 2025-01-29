/**
 * Renders table cell with specific json info
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2025 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: 'td',
  classNames: ['fb-table-col-json', 'multiline', 'hidden-xs'],
  attributeBindings: ['style'],

  /**
   * @virtual
   * @type {string}
   */
  style: undefined,
});
