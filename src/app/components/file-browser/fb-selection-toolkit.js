/**
 * Tools (actions) for selected files.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import { inject as service } from '@ember/service';
import ItemsTooltipContent from 'oneprovider-gui/utils/items-tooltip-content';
import { syncObserver } from 'onedata-gui-common/utils/observer';

const mixins = Object.freeze([
  I18n,
]);

export default Component.extend(...mixins, {
  classNames: ['fb-selection-toolkit'],
  classNameBindings: [
    'isPillVisible:pill-visible:pill-hidden',
    'mobileMode:mobile-mode:desktop-mode',
  ],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbSelectionToolkit',

  /**
   * Array of browsable items, eg. files.
   * @type {Array<any>}
   */
  items: undefined,

  /**
   * @virtual
   */
  allButtonsArray: undefined,

  /**
   * @virtual
   */
  selectionContext: undefined,

  /**
   * Set to true, to make it floating
   * @type {boolean}
   */
  mobileMode: false,

  lastPositiveItemsCount: 0,

  fileActionsOpen: false,

  /**
   * @type {Utils.ItemsTooltipContent}
   */
  itemsTooltipContent: undefined,

  itemsCount: reads('items.length'),

  menuButtons: computed(
    'allButtonsArray',
    'selectionContext',
    function menuButtons() {
      const {
        allButtonsArray,
        selectionContext,
      } = this.getProperties('allButtonsArray', 'selectionContext');
      return getButtonActions(allButtonsArray, selectionContext);
    }
  ),

  isPillVisible: gt('itemsCount', 1),

  /**
   * Sync: sets some property value, which should be done immediately.
   */
  rememberLastPositiveCount: syncObserver(
    'itemsCount',
    function rememberLastPositiveCount() {
      if (this.itemsCount > 0) {
        this.set('lastPositiveItemsCount', this.itemsCount);
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.rememberLastPositiveCount();
    const itemsTooltipContent = ItemsTooltipContent.extend({
      items: reads('component.items'),
    }).create({
      ownerSource: this,
      component: this,
    });
    this.set('itemsTooltipContent', itemsTooltipContent);
  },

  actions: {
    toggleFileActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('fileActionsOpen');
      this.set('fileActionsOpen', _open);
    },
    onItemsTooltipShown() {
      this.itemsTooltipContent.onItemsTooltipShown(...arguments);
    },
  },
});
