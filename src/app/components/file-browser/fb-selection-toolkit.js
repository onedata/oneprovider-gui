/**
 * Tools (actions) for selected files.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { observer, computed } from '@ember/object';
import { gt } from '@ember/object/computed';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import { inject as service } from '@ember/service';
import { conditional, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['fb-selection-toolkit'],
  classNameBindings: ['opened:opened:closed', 'mobileMode:mobile-mode:desktop-mode'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbSelectionToolkit',

  /**
   * @virtual
   */
  allButtonsArray: undefined,

  /**
   * @virtual
   */
  selectionContext: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  isInModal: false,

  /**
   * Set to true, to make it floating
   * @type {boolean}
   */
  mobileMode: false,

  itemsCount: 0,

  lastPositiveItemsCount: 0,

  fileActionsOpen: false,

  rememberLastPositiveCount: observer(
    'itemsCount',
    function rememberLastPositiveCount() {
      const itemsCount = this.get('itemsCount');
      if (itemsCount > 0) {
        this.set('lastPositiveItemsCount', itemsCount);
      }
    }
  ),

  popoverClass: conditional(
    'isInModal',
    raw('over-modals'),
    raw(null)
  ),

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

  opened: gt('itemsCount', 0),

  init() {
    this._super(...arguments);
    this.rememberLastPositiveCount();
  },

  actions: {
    toggleFileActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('fileActionsOpen');
      this.set('fileActionsOpen', _open);
    },
  },
});
