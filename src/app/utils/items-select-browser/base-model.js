import EmberObject, { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { promise, or, raw } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import _ from 'lodash';

export default EmberObject.extend(OwnerInjector, I18n, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.baseBrowserModel',

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

  //#region state

  dirId: undefined,

  browserSelectedItems: undefined,

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

  onSubmitSingleItem: or(
    computed('itemsSelectBrowser.submitSingleItem', function onSubmitSingleItem() {
      const itemsSelectBrowser = this.get('itemsSelectBrowser');
      return get(itemsSelectBrowser, 'submitSingleItem').bind(itemsSelectBrowser);
    }),
    raw(notImplementedThrow)
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
  initialRequiredDataProxy: promise.object(promise.all(
    'initialDirProxy'
  )),

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
