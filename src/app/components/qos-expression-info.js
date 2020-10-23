import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
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

  count: reads('matchingStorages.length'),

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
