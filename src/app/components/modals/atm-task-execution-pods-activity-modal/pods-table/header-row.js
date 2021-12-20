/**
 * Shows pods table header.
 *
 * @module components/modals/atm-task-execution-pods-activity-modal/pods-table/header-row
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
   * @type {'current'|'all'}
   */
  podsFilter: undefined,

  /**
   * @virtual
   * @type {(filter: 'current'|'all') => void}
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
