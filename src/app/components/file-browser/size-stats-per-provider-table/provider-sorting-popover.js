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
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

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
   * @type {String}
   */
  triggerSelector: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  isOpened: false,

  /**
   * @type {'name'|'status'}
   */
  sortingMethod: 'name',

  /**
   * @type {Function}
   * @param {string} value
   * @returns {undefined}
   */
  sortingMethodChanged: notImplementedReject,

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
