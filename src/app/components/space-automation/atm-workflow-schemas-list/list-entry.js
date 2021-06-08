/**
 * Shows single workflow schema. It is an internal component of atm-workflow-schemas-list.
 *
 * @module components/space-automation/atm-workflow-schemas-list/list-entry
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: [
    'list-entry',
    'iconified-block',
    'hoverable',
  ],

  /**
   * @virtual
   * @type {Models.AtmWorkflowSchema}
   */
  atmWorkflowSchema: undefined,

  /**
   * @virtual
   * @type {Function}
   * @returns {any}
   */
  onSelect: undefined,

  /**
   * @override
   */
  click() {
    this._super(...arguments);

    const onSelect = this.get('onSelect');
    onSelect && onSelect();
  },
});
