/**
 * A base settings, logic and state for `items-select-browser` component.
 *
 * Some virtual properties should be set at creation time and some are intended to be
 * implemented by subclasses - see properties JSDocs for details.
 *
 * Note, that this is model for selector component, that is parent of file-browser.
 * Browser component should be returned by the selector model. Typically browser models
 * for selectors are specially prepared (eg. see `selector-filesystem-browser-model`)
 * to have behaviour and actions different from regular browsers.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import _ from 'lodash';
import computedT from 'onedata-gui-common/utils/computed-t';
import { conditional, and, raw, equal, or, bool, isEmpty } from 'ember-awesome-macros';

export default EmberObject.extend(OwnerInjector, I18n, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.itemsSelectBrowser.baseModel',

  /**
   * To inject.
   * Base fields:
   * - maxItems: Number - if present, maximum N items can be confirmed in select
   * @virtual
   */
  constraintSpec: undefined,

  /**
   * To inject.
   * @virtual
   */
  space: undefined,

  /**
   * Typically to implement by subclasses.
   * @virtual
   */
  browserModel: undefined,

  /**
   * Typically to implement by subclasses.
   * @virtual
   */
  dirProxy: undefined,

  /**
   * Typically to implement by subclasses.
   * @virtual
   * @type {Function}
   */
  fetchChildren: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   * Typically to implement by subclasses.
   * Leave undefined to use default resolver.
   */
  resolveItemParent: undefined,

  /**
   * Shown in selector modal header.
   * Typically to implement by subclasses.
   * @virtual
   * @type {SafeString|String}
   */
  itemTypeText: undefined,

  /**
   * Should be set by component when this model is injected to component.
   * @virtual
   */
  itemsSelectBrowser: undefined,

  /**
   * @virtual optional
   */
  browserExtensionComponentName: '',

  //#region state

  dirId: undefined,

  browserSelectedItems: undefined,

  submitCurrentLabel: computedT('submitCurrentLabel', {}, { defaultValue: '' }),

  submitCurrentAvailable: computed(
    'submitCurrentLabel',
    function submitCurrentAvailable() {
      return Boolean(String(this.get('submitCurrentLabel')));
    }
  ),

  submitMode: conditional(
    and('submitCurrentAvailable', 'noItemSelected'),
    raw('currentDir'),
    raw('selected'),
  ),

  submitLabel: conditional(
    equal('submitMode', raw('currentDir')),
    'submitCurrentLabel',
    computedT('confirmSelection'),
  ),

  noItemSelected: isEmpty('selectorSelectedItems'),

  submitDisabled: bool(
    and(
      equal('submitMode', raw('selected')),
      or(
        'noItemSelected',
        'validationError',
      ),
    )
  ),

  selectorSelectedItems: computed(
    'browserSelectedItems.[]',
    'dir',
    function selectorSelectedItems() {
      const {
        browserSelectedItems,
        dir,
      } = this.getProperties('browserSelectedItems', 'dir');
      return _.without(browserSelectedItems, dir);
    }
  ),

  //#region

  //#region component API

  onSubmitSingleItem: computed(
    'itemsSelectBrowser.submitSingleItem',
    function onSubmitSingleItem() {
      const itemsSelectBrowser = this.get('itemsSelectBrowser');
      if (!itemsSelectBrowser) {
        return notImplementedThrow;
      }
      const submitSingleItem = get(itemsSelectBrowser, 'submitSingleItem');
      if (!submitSingleItem || typeof submitSingleItem !== 'function') {
        return notImplementedThrow;
      }
      return submitSingleItem.bind(itemsSelectBrowser);
    }
  ),

  //#region

  maxItems: reads('constraintSpec.maxItems'),

  /**
   * NOTE: observing only space, because it should reload initial dir after whole space change
   * @type {PromiseObject<Models.File>}
   */
  initialDirProxy: computed('space', function initialDirProxy() {
    return this.get('dirProxy');
  }),

  /**
   * The browser component will be rendered only if this promise object is fulfilled.
   * @type {ComputedProperty<PromiseObject>}
   */
  initialRequiredDataProxy: reads('initialDirProxy'),

  validationError: computed(
    'constraintSpec',
    'selectorSelectedItems.[]',
    function validationError() {
      return this.getValidationError();
    }
  ),

  dir: computedLastProxyContent('dirProxy'),

  init() {
    this._super(...arguments);
    if (!this.get('browserSelectedItems')) {
      this.set('browserSelectedItems', []);
    }
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.browserModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  getValidationError() {
    const maxItems = this.get('maxItems');
    if (maxItems && this.get('selectorSelectedItems.length') > maxItems) {
      return this.t('maxItemsConstraint', { count: maxItems });
    }
  },

  setDirId(dirId) {
    this.set('dirId', dirId);
  },

  setSelectedItems(selectedItems) {
    this.set('browserSelectedItems', selectedItems);
  },

  resetState() {
    this.set('browserSelectedItems', []);
  },
});
