/**
 * A container for browsers that serves for items selection.
 *
 * An instance of `selectorModel` should be provided for logic, settings and state of
 * this component.
 *
 * See `utils/items-select-browser/base-model` for model implementation.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { guidFor } from '@ember/object/internals';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
  InModalBrowserContainerBase,
];

export default Component.extend(...mixins, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.itemsSelectBrowser',

  /**
   * @virtual
   */
  modal: undefined,

  /**
   * @virtual
   */
  selectorModel: undefined,

  /**
   * @virtual
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   */
  onSubmit: notImplementedIgnore,

  /**
   * @virtual optional
   */
  parentModalDialogSelector: undefined,

  /**
   * Custom selector for items list scroll container.
   * Should be overridden **only** if items-select-browser is not in one-modal.
   * @virtual optional
   */
  contentScrollSelector: undefined,

  /**
   * Alias of property for ItemBrowserContainerBase - please do not use it directly
   * in code. Use: `browserSelectedItems` or `selectorSelectedItems` instead.
   * @implements ItemBrowserContainerBase
   */
  selectedItems: reads('browserSelectedItems'),

  /**
   * @implements ItemBrowserContainerBase
   */
  dirProxy: reads('selectorModel.dirProxy'),

  validationError: reads('selectorModel.validationError'),

  dirId: reads('selectorModel.dirId'),

  dir: reads('selectorModel.dir'),

  space: reads('selectorModel.space'),

  submitMode: reads('selectorModel.submitMode'),

  submitLabel: reads('selectorModel.submitLabel'),

  submitDisabled: reads('selectorModel.submitDisabled'),

  initialRequiredDataProxy: reads('selectorModel.initialRequiredDataProxy'),

  browserSelectedItems: reads('selectorModel.browserSelectedItems'),

  selectorSelectedItems: reads('selectorModel.selectorSelectedItems'),

  browserModel: reads('selectorModel.browserModel'),

  /**
   * @type {ComputedPropoerty<undefined|Function>}
   */
  resolveItemParent: reads('selectorModel.resolveItemParent'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: reads('space.privileges'),

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  init() {
    this._super(...arguments);
    const selectorModel = this.get('selectorModel');
    if (!selectorModel) {
      throw new Error(
        'compontnt:items-select-browser#init: selectorModel is not provided'
      );
    }
    set(selectorModel, 'itemsSelectBrowser', this);
  },

  /**
   * @override
   */
  changeSelectedItemsImmediately(selectedItems) {
    this.get('selectorModel').setSelectedItems(selectedItems);
  },

  submitSingleItem(item) {
    return this.get('onSubmit')([item]);
  },

  actions: {
    cancel() {
      this.get('onCancel')();
    },
    submit() {
      const {
        onSubmit,
        selectorSelectedItems,
        submitMode,
        dir,
      } = this.getProperties('onSubmit', 'selectorSelectedItems', 'submitMode', 'dir');
      const items = submitMode === 'currentDir' ? [dir] : selectorSelectedItems;
      return onSubmit(items);
    },
    updateDirEntityId(dirId) {
      this.get('selectorModel').setDirId(dirId);
    },
    changeSelectedItems(items) {
      return this.changeSelectedItems(items);
    },
    resolveItemParent(item) {
      const selectorModel = this.get('selectorModel');
      const resolveItemParentFun = get(selectorModel, 'resolveItemParent');
      return resolveItemParentFun ?
        resolveItemParentFun.call(selectorModel, item) :
        defaultResolveParent(item);
    },
  },
});
