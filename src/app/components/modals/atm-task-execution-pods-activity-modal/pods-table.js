/**
 * Shows pods statuses related to task execution.
 *
 * @module components/modals/atm-task-execution-pods-activity-modal/pods-table
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { conditional, raw, eq } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

const statusesOrder = [
  'running',
  'pending',
  'succeeded',
  'failed',
  'unknown',
  'terminated',
];
const notCurrentStatuses = [
  'succeeded',
  'failed',
  'terminated',
];

export default Component.extend(I18n, {
  classNames: ['pods-table'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.atmTaskExecutionPodsActivityModal.podsTable',

  /**
   * @virtual
   * @type {Object<OpenfaasPodId,OpenfaasPodActivity>}
   */
  activityRegistry: undefined,

  /**
   * @virtual
   * @type {OpenfaasPodId|undefined}
   */
  selectedPodId: undefined,

  /**
   * @virtual
   * @type {(podId: OpenfaasPodId|undefined) => void}
   */
  onPodSelect: undefined,

  /**
   * @type {'current'|'all'}
   */
  podsFilter: 'current',

  /**
   * @type {Array<string>}
   */
  statusesOrder,

  /**
   * @type {Array<string>}
   */
  notCurrentStatuses,

  /**
   * @type {ComputedProperty<Array<{ podId: OpenfaasPodId, podActivity: OpenfaasPodActivity }>>}
   */
  podRows: computed('activityRegistry', function podRows() {
    const activityRegistry = this.get('activityRegistry');
    if (!activityRegistry) {
      return [];
    }
    const podsIds = Object.keys(activityRegistry);
    // Generating sorting keys for each pod. Sorting key consists of two elements:
    // - position of pod status in `statusesOrder` array,
    // - pod ID.
    // Example generated key: `'0002#some_pod_id'`
    const sortKeyToPodId = podsIds.reduce((acc, podId) => {
      let statusIdx = statusesOrder.indexOf(
        (activityRegistry[podId].currentStatus || '').toLowerCase()
      );
      if (statusIdx === -1) {
        statusIdx = statusesOrder.length;
      }
      // This method of sorting is correct only when `statusesOrder.length <= 9999`.
      // Increment padding to handle more statuses.
      const statusIdxString = String(statusIdx).padStart(4, '0');
      // Using `#` character as separator because `#` < `0` when sorting.
      const sortKey = `${statusIdxString}#${podId}`;
      acc[sortKey] = podId;
      return acc;
    }, {});

    const sortedKeys = Object.keys(sortKeyToPodId).sort();
    return sortedKeys.map(sortKey => {
      const podId = sortKeyToPodId[sortKey];
      return {
        podId,
        podActivity: activityRegistry[podId],
      };
    });
  }),

  /**
   * @type {ComputedProperty<Array<{ podId: OpenfaasPodId, podActivity: OpenfaasPodActivity }>>}
   */
  filteredPodRows: computed(
    'podRows',
    'podsFilter',
    'notCurrentStatuses',
    function filteredPodRows() {
      const {
        podRows,
        podsFilter,
        notCurrentStatuses,
      } = this.getProperties(
        'podRows',
        'podsFilter',
        'notCurrentStatuses'
      );

      if (podsFilter === 'current') {
        return podRows.filter(({ podActivity: { currentStatus } }) =>
          !notCurrentStatuses.includes((currentStatus || '').toLowerCase())
        );
      } else {
        return podRows;
      }
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  noPodsMessage: conditional(
    eq('podsFilter', raw('current')),
    computedT('noPods.current'),
    computedT('noPods.all'),
  ),

  actions: {
    podsFilterChange(newPodsFilter) {
      this.set('podsFilter', newPodsFilter);
    },
  },
});
