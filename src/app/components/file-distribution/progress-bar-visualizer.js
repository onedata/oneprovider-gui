/**
 * Renders visualization of file replication rate.
 *
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
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['progress-bar-visualizer'],
  classNameBindings: ['neverSynchronized:never-synchronized:synchronized'],

  i18n: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistribution.progressBarVisualizer',

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
   * @virtual
   * @type {Function}
   */
  getProvidersUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {String}
   */
  providerId: undefined,

  /**
   * @virtual
   */
  errorOnStorage: undefined,

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
   * @type {ComputedProperty<string>}
   */
  errorMessage: computed('errorOnStorage', function errorMessage() {
    return this.errorExtractor.getMessage(this.errorOnStorage)?.message ||
      this.errorOnStorage.description ||
      this.t('unknownError') + ': ' + JSON.stringify(this.errorOnStorage);
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

  /**
   * Frame name, where Onezone providers link should be opened
   * @type {String}
   */
  navigateProvidersTarget: '_top',

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  providersUrl: computed('providerId', function providersUrl() {
    const providerId = this.get('providerId');
    return this.getProvidersUrl({ oneproviderId: providerId });
  }),
});
