/**
 * A head of layout for `items-select-browser`.
 *
 * Shows description what kind of items can be selected in selector.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { raw, and, gt, equal, or, conditional } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  classNames: ['items-select-browser-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.itemsSelectBrowser.header',

  /**
   * @virtual
   */
  selectorModel: undefined,

  constraintSpec: reads('selectorModel.constraintSpec'),

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

  itemTypeText: or(
    'selectorModel.itemTypeText',
    conditional(
      equal('maxItems', raw(1)),
      computedT('item.single'),
      computedT('item.multi')
    ),
  ),

  init() {
    this._super(...arguments);
    if (!this.get('constraintSpec')) {
      this.set('constraintSpec', {});
    }
  },
});
