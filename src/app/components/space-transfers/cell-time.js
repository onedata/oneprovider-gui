/**
 * Cell with time for transfer row.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2025 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-time'],

  /**
   * @virtual
   * @type {TransferTableRecord}
   */
  record: undefined,

  /**
   * @virtual
   * @type {string}
   */
  propertyName: undefined,
});
