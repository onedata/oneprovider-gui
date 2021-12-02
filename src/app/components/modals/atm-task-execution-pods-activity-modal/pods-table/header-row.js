import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['pods-table-header-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.modals.atmTaskExecutionPodsActivityModal.podsTable.headerRow',

  /**
   * @virtual
   * @type {'working'|'all'}
   */
  podsFilter: undefined,

  /**
   * @virtual
   * @type {(filter: 'working'|'all') => void}
   */
  onPodsFilterChange: undefined,

  actions: {
    podsFilterChange(newPodsFilter) {
      const onPodsFilterChange = this.get('onPodsFilterChange');
      if (onPodsFilterChange) {
        onPodsFilterChange(newPodsFilter);
      }
    },
  },
});
