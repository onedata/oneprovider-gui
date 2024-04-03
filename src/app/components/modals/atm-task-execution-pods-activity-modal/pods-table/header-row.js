/**
 * Shows pods table header.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['pods-table-header-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.modals.atmTaskExecutionPodsActivityModal.podsTable.headerRow',

  /**
   * @virtual
   * @type {number}
   */
  allPodsCount: undefined,

  /**
   * @virtual
   * @type {number}
   */
  currentPodsCount: undefined,

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
