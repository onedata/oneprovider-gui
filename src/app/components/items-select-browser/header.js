import Component from '@ember/component';
import { computed } from '@ember/object';
import { raw, and, gt, array, or, conditional } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['items-select-browser-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.itemsSelectBrowser.header',

  /**
   * Properties:
   * - itemType: String - items that can be selected, one of:
   *     `fileOrDirectory`, `file`, `directory`, `dataset`, `archive`
   * - maxItems: Number - maximal number of items to select
   * @virtual
   * @type {Object}
   */
  constraintSpec: undefined,

  /**
   * @type {Array}
   */
  allowedItemTypes: Object.freeze([
    'fileOrDirectory',
    'file',
    'directory',
    'dataset',
    'archive',
  ]),

  /**
   * If true, a constraint text about items count should be shown
   * @type {ComputedProperty<Boolean>}
   */
  showMaxItemsConstraint: and('maxItems', gt('maxItems', 1)),

  /**
   * Maximal number of items that can be selected. Nullish or 0 value means that
   * no limit is set and any number of items can be selected.
   * @type {ComputedProperty<Boolean>}
   */
  maxItems: or('constraintSpec.maxItems', raw(null)),

  itemType: conditional(
    array.includes('allowedItemTypes', 'constraintSpec.itemType'),
    'constraintSpec.itemType',
    raw('item'),
  ),

  itemTypeText: computed(
    'itemType',
    'maxItems',
    function itemTypeText() {
      const {
        itemType,
        maxItems,
      } = this.getProperties('itemType', 'maxItems');
      // fallback to "multi" if maxItems has invalid value, also show "multi" when unlimited
      const quantity = (maxItems === 1) ? 'single' : 'multi';
      return this.t(`itemType.${quantity}.${itemType}`);
    }
  ),

  init() {
    this._super(...arguments);
    if (!this.get('constraintSpec')) {
      this.set('constraintSpec', {});
    }
  },
});
