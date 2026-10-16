/**
 * Renders popover with options for sorting providers.
 *
 * @author Agnieszka Raczek
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: '',

  classNames: ['provider-sorting-popover'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.sizeStatsPerProviderTable.providerSortingPopover',

  /**
   * @virtual
   * @type {string}
   */
  triggerSelector: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isOpened: false,

  /**
   * @type {'name'|'status'}
   */
  sortingMethod: 'name',

  /**
   * @type {(value: string) => void}
   */
  sortingMethodChanged: undefined,

  /**
   * @type {Ember.ComputedProperty<Array<Object>>}
   */
  sortingMethodOptions: computed(function sortingMethodOptions() {
    return [{
      label: this.t('name'),
      value: 'name',
    }, {
      label: this.t('status'),
      value: 'status',
    }];
  }),

  actions: {
    sortingMethodChanged(value) {
      this.set('sortingMethod', value);
      this.sortingMethodChanged?.(value);
    },
  },
});
