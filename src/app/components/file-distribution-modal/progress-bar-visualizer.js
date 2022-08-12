/**
 * Renders visualization of file replication rate.
 * 
 * @module components/file-distribution-modal/progress-bar-visualizer
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import { or, eq } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['progress-bar-visualizer'],
  classNameBindings: ['neverSynchronized:never-synchronized:synchronized'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.progressBarVisualizer',

  /**
   * @virtual
   * @type {number}
   */
  percentage: undefined,

  /**
   * @virtual
   * @type {number}
   */
  size: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isDataIncomplete: or(
    eq('percentage', undefined),
    eq('size', undefined),
  ),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  percentageText: computed('percentageNormalized', function percentageText() {
    const percentage = this.get('percentageNormalized');
    return percentage !== undefined ? `${Math.floor(percentage)}%` : '';
  }),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  occupiedSpaceBarStyle: computed(
    'percentageNormalized',
    function occupiedSpaceBarStyle() {
      const percentageNormalized =
        this.get('percentageNormalized');
      return htmlSafe(
        percentageNormalized === undefined ?
        '' : `flex-basis: ${percentageNormalized}%`
      );
    }
  ),

  /**
   * @type {Ember.ComputedProperty<number|undefined>}
   */
  percentageNormalized: computed(
    'percentage',
    function percentageNormalized() {
      const percentage = this.get('percentage');
      return percentage === undefined ? undefined : Math.min(percentage, 100);
    }
  ),
});
