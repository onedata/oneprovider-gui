/**
 * Tools (actions) for selected files.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { observer, computed, get } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import { inject as service } from '@ember/service';
import ItemsTooltipContent from 'oneprovider-gui/utils/items-tooltip-content';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { or, raw } from 'ember-awesome-macros';

const mixins = Object.freeze([
  I18n,
  FileConsumerMixin,
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

  /**
   * @override
   */
  fileRequirements: computed('items', function fileRequirements() {
    if (!this.items) {
      return [];
    }
    return this.items.map(item =>
      new FileRequirement({
        fileGri: get(item, 'id'),
        properties: ['name'],
      }),
    );
  }),

  /**
   * @override
   */
  usedFiles: or('items', raw([])),

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

  rememberLastPositiveCount: observer(
    'itemsCount',
    function rememberLastPositiveCount() {
      const itemsCount = this.get('itemsCount');
      if (itemsCount > 0) {
        this.set('lastPositiveItemsCount', itemsCount);
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
