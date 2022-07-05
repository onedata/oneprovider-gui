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
   * @type {boolean}
   */
  unknownData: false,

  /**
   * @virtual
   * @type {number}
   */
  percentage: undefined,

  /**
   * @virtual
   * @type {number}
   */
  fileSize: undefined,

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  percentageText: computed('percentage', 'unknownData', function percentageText() {
    const percentage = this.get('percentage');
    return percentage !== undefined ? `${Math.floor(percentage)}%` : '';
  }),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  _occupiedSpaceBarStyle: computed('_barOccupiedPercentsNormalized', function () {
    const _barOccupiedPercentsNormalized =
      this.get('_barOccupiedPercentsNormalized');
    return htmlSafe(
      _barOccupiedPercentsNormalized === undefined ?
      '' : `flex: 0 0 ${_barOccupiedPercentsNormalized}%`
    );
  }),

  /**
   * @type {Ember.ComputedProperty<number|undefined>}
   */
  _barOccupiedPercentsNormalized: computed('percentage', function () {
    const percentage = this.get('percentage');
    return percentage === undefined ?
      undefined : Math.min(percentage, 100);
  }),

  didInsertElement() {
    this._super(...arguments);
  },
});
