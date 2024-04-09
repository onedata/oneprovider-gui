/**
 * This class is trying to be as-much-as-it-can compatible both with `Utils.Action` and
 * original item browsers implementation of menu actions. It should be refactored to be
 * fully compatible with `Utils.Action`. Items browsers should be refactored to be able to
 * use that interface.
 *
 * Currently default-logic is partially copied from plain object creation in
 * `BaseBrowserModel.createItemBrowserAction`.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import computedT from 'onedata-gui-common/utils/computed-t';
import { tag } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

const mixins = [
  OwnerInjector,
  I18n,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  clipboardActions: service(),

  /**
   * @override
   */
  i18nPrefix: tag `utils.dataset.actions.${'actionId'}`,

  /**
   * @virtual
   * @type {string}
   */
  actionId: undefined,

  /**
   * @virtual
   * @type {{ selectedItems: Array }}
   */
  context: undefined,

  // TODO: VFS-9396 refactor to be compatible with Utils.Action
  /**
   * @virtual
   * @type (selectedItems: Array) => void
   */
  onExecute: notImplementedIgnore,

  /**
   * @type {ComputedProperty<string>}
   */
  icon: tag `browser-${'actionId'}`,

  /**
   * @type {ComputedProperty<SafeString|string>}
   */
  title: computedT('title'),

  /**
   * @type {boolean}
   */
  disabled: false,

  // TODO: VFS-9396 refactor to be compatible with Utils.Action
  /**
   * @type {ComputedProperty<string>}
   */
  class: tag `file-action-${'actionId'} ${'actionId'}`,

  /**
   * @type {Array<Component.FileBrowser.ActionContext>}
   */
  showIn: Object.freeze([]),

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  selectedItems: reads('context.selectedItems'),

  // TODO: VFS-9396 refactor to be compatible with Utils.Action
  execute(selectedItems) {
    const effSelectedItems = selectedItems ?
      selectedItems : this.get('selectedItems');
    return this.onExecute(effSelectedItems);
  },

  // TODO: VFS-9396 refactor to be compatible with Utils.Action
  action: computed(function action() {
    return (...args) => this.execute(...args);
  }),
});
