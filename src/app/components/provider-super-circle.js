/**
 * An animated cirlce that should be rendered below provider circle.
 *
 * It denotes that provider is transferring data: in or out.
 *
 * @author Jakub Liput
 * @copyright (C) 2017 ACK CYFRONET AGH
 * @copyright (C) 2025 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  classNames: ['provider-super-circle'],
  classNameBindings: ['isSource:source', 'isDestination:destination'],
  attributeBindings: ['style'],

  /**
   * @virtual
   * @type {string}
   */
  circleColor: '',

  /**
   * @virtual optional
   * @type {boolean}
   */
  isSource: false,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isDestination: false,

  /**
   * Computed provider-specific style
   * @type {ComputedProperty<String>}
   */
  style: computed('circleColor', function style() {
    return htmlSafe(`background-color: ${this.circleColor};`);
  }),
});
