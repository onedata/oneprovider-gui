/**
 * Shows pods table data row.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import isDirectlyClicked from 'onedata-gui-common/utils/is-directly-clicked';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'tr',
  classNames: ['pods-table-pod-row'],
  classNameBindings: ['isSelected', 'statusClass'],
  attributeBindings: ['podId:data-pod-id'],

  /**
   * @virtual
   * @type {OpenfaasPodId}
   */
  podId: undefined,

  /**
   * @virtual
   * @type {OpenfaasPodActivity}
   */
  podActivity: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  isSelected: undefined,

  /**
   * @virtual
   * @type {(podId: OpenfaasPodId) => void}
   */
  onSelect: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  statusClass: computed('podActivity.currentStatus', function statusClass() {
    const currentStatus = String(this.get('podActivity.currentStatus') || '');
    return currentStatus ? `status-${currentStatus.toLowerCase()}` : '';
  }),

  /**
   * @type {ComputedProperty<number|null>}
   */
  statusSinceTimestamp: computed(
    'podActivity.lastStatusChangeTimestamp',
    function statusSinceTimestamp() {
      const lastStatusChangeTimestamp =
        this.get('podActivity.lastStatusChangeTimestamp');
      return Number.isInteger(lastStatusChangeTimestamp) ?
        lastStatusChangeTimestamp / 1000 : null;
    }
  ),

  /**
   * @override
   */
  click(event) {
    this._super(...arguments);

    const {
      element,
      onSelect,
      podId,
    } = this.getProperties('element', 'onSelect', 'podId');

    if (isDirectlyClicked(event, element) && onSelect) {
      onSelect(podId);
    }
  },
});
