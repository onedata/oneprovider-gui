/**
 * A container for browsers that serves for items selection.
 *
 * An instance of `selectorModel` should be provided for logic, settings and state of
 * this component.
 * 
 * See `utils/items-select-browser/base-model` for model implementation.
 *
 * @module components/items-select-browser
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
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

const mixins = [
  I18n,
  ItemBrowserContainerBase,
];

export default Component.extend(...mixins, {
  tagName: '',

  fileManager: service(),
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
   * Should be overriden **only** if items-select-browser is not in one-modal.
   * @virtual optional
   */
  contentScrollSelector: undefined,

  _document: document,

  /**
   * True if element has been redered (used because component is tagless)
   */
  isRendered: false,

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
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('space.privileges'),

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  contentScroll: computed(
    'isRendered',
    'modalBodyId',
    'contentScrollSelector',
    function contentScroll() {
      const {
        _document,
        isRendered,
        modalBodyId,
        contentScrollSelector,
      } = this.getProperties(
        '_document',
        'isRendered',
        'modalBodyId',
        'contentScrollSelector'
      );
      if (!isRendered) {
        console.error(
          'component:items-select-browser#contentScroll: tried to compute contentScroll before render'
        );
      }
      if (contentScrollSelector) {
        return _document.querySelector(contentScrollSelector);
      }
      let scrollElement = _document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
      if (!scrollElement) {
        console.error(
          'component:items-select-browser#contentScroll: no .bs-modal-body-scroll body element found, infinite scroll may be broken'
        );
        scrollElement = _document.body;
      }
      return scrollElement;
    }
  ),

  submitSingleItem(item) {
    return this.get('onSubmit')([item]);
  },

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

  didInsertElement() {
    this._super(...arguments);
    this.set('isRendered', true);
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
      this.get('selectorModel').setSelectedItems(items);
    },
    fetchChildren(...args) {
      const selectorModel = this.get('selectorModel');
      return get(selectorModel, 'fetchChildren').call(selectorModel, ...args);
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
