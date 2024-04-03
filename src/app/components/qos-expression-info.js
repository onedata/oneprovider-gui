/**
 * Shows info about properly backend-evaluated QoS expression, eg. matching storages
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  classNames: ['qos-expression-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.qosExpressionInfo',

  /**
   * List of storages that matches QoS expression
   * @virtual
   * @type {Array<Object>}
   */
  matchingStorages: undefined,

  /**
   * @type {ComputedProperty<Number>}
   */
  count: reads('matchingStorages.length'),

  /**
   * Key for i18n translation for matching storages text (without i18nPrefix)
   * @type {ComputedProperty<String>}
   */
  matchingStoragesTranslationKey: computed(
    'count',
    function matchingStoragesTranslationKey() {
      const count = this.get('count');
      if (count === undefined) {
        return null;
      }
      let suffix;
      if (count <= 0) {
        suffix = 'None';
      } else if (count === 1) {
        suffix = 'Single';
      } else if (count > 1) {
        suffix = 'Plural';
      }
      return `matchingStorages${suffix}`;
    }
  ),
});
