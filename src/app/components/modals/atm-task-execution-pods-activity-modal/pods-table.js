/**
 * Shows pods statuses related to task execution.
 *
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
  statusRegistry: undefined,

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
  podRows: computed('statusRegistry', function podRows() {
    const statusRegistry = this.get('statusRegistry');
    if (!statusRegistry) {
      return [];
    }
    const podsIds = Object.keys(statusRegistry);
    // Generating sorting keys for each pod. Sorting key consists of two elements:
    // - position of pod status in `statusesOrder` array,
    // - pod ID.
    // Example generated key: `'0002#some_pod_id'`
    const sortKeyToPodId = podsIds.reduce((acc, podId) => {
      let statusIdx = statusesOrder.indexOf(
        (statusRegistry[podId].currentStatus || '').toLowerCase()
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
        podActivity: statusRegistry[podId],
      };
    });
  }),

  /**
   * @type {ComputedProperty<Array<{ podId: OpenfaasPodId, podActivity: OpenfaasPodActivity }>>}
   */
  currentPodRows: computed('podRows', 'notCurrentStatuses', function currentPodRows() {
    const {
      podRows,
      notCurrentStatuses,
    } = this.getProperties(
      'podRows',
      'notCurrentStatuses'
    );

    return podRows.filter(({ podActivity: { currentStatus } }) =>
      !notCurrentStatuses.includes((currentStatus || '').toLowerCase())
    );
  }),

  /**
   * @type {ComputedProperty<Array<{ podId: OpenfaasPodId, podActivity: OpenfaasPodActivity }>>}
   */
  filteredPodRows: computed(
    'podsFilter',
    'podRows',
    'currentPodRows',
    function filteredPodRows() {
      const {
        podsFilter,
        podRows,
        currentPodRows,
      } = this.getProperties(
        'podsFilter',
        'podRows',
        'currentPodRows'
      );
      return podsFilter === 'current' ? currentPodRows : podRows;
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

  init() {
    this._super(...arguments);

    const {
      podRows,
      currentPodRows,
    } = this.getProperties('podRows', 'currentPodRows');

    // There are no current pods, but are some pods in general -> switch to
    // "all" view.
    if (!currentPodRows.length && podRows.length) {
      this.set('podsFilter', 'all');
    }
  },

  actions: {
    podsFilterChange(newPodsFilter) {
      this.set('podsFilter', newPodsFilter);
    },
  },
});
