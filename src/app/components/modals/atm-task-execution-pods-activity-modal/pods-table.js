import Component from '@ember/component';
import { computed } from '@ember/object';
import { conditional, raw, eq } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

const statusesOrder = ['running', 'waiting', 'terminated'];
const notWorkingStatuses = ['terminated'];

export default Component.extend(I18n, {
  tagName: 'table',
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
   * @type {'working'|'all'}
   */
  podsFilter: 'working',

  /**
   * @type {Array<string>}
   */
  statusesOrder,

  /**
   * @type {Array<string>}
   */
  notWorkingStatuses,

  /**
   * @type {ComputedProperty<Array<{ podId: OpenfaasPodId, podActivity: OpenfaasPodActivity }>>}
   */
  podRows: computed('activityRegistry', function podRows() {
    const activityRegistry = this.get('activityRegistry');
    if (!activityRegistry) {
      return [];
    }
    const podsIds = Object.keys(activityRegistry);
    const sortKeyToPodId = podsIds.reduce((acc, podId) => {
      let statusIdx = statusesOrder.indexOf(activityRegistry[podId].currentStatus);
      if (statusIdx === -1) {
        statusIdx = statusesOrder.length;
      }
      // Using `#` character as separator because `#` < `0` when sorting
      const sortKey = `${statusIdx}#${podId}`;
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
    'notWorkingStatuses',
    function filteredPodRows() {
      const {
        podRows,
        podsFilter,
        notWorkingStatuses,
      } = this.getProperties(
        'podRows',
        'podsFilter',
        'notWorkingStatuses'
      );

      if (podsFilter !== 'working') {
        return podRows;
      }
      return podRows.filter(({ podActivity: { currentStatus } }) =>
        !notWorkingStatuses.includes(currentStatus)
      );
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  noPodsMessage: conditional(
    eq('podsFilter', raw('working')),
    computedT('noPods.working'),
    computedT('noPods.all'),
  ),

  actions: {
    podsFilterChange(newPodsFilter) {
      this.set('podsFilter', newPodsFilter);
    },
  },
});
