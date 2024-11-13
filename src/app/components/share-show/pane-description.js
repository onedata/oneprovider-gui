/**
 * Content for "description" tab for single share
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { set, computed } from '@ember/object';
import { bool } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

export default Component.extend(I18n, {
  classNames: ['share-show-pane-description', 'pane-description', 'row'],

  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.paneDescription',

  /**
   * @virtual
   * @optional
   */
  publicMode: false,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual
   * @type {String} one of: visual, markdown
   */
  editorMode: 'visual',

  /**
   * If true, show information about lack of description and call to action to create it
   * @type {Boolean}
   */
  isEmptyDescriptionInfoVisible: false,

  currentMarkdown: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasManageSharesPrivilege: bool('space.privileges.manageShares'),

  isStartButtonDisabled: bool('startButtonDisabledTip'),

  startButtonDisabledTip: computed(
    'hasManageSharesPrivilege',
    function startButtonDisabledTip() {
      if (!this.hasManageSharesPrivilege) {
        return insufficientPrivilegesMessage({
          i18n: this.i18n,
          modelName: 'space',
          privilegeFlag: 'space_manage_shares',
        });
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.loadMarkdown();
    if (!this.get('share.description')) {
      this.set('isEmptyDescriptionInfoVisible', true);
    }
  },

  loadMarkdown() {
    return this.set('currentMarkdown', this.get('share.description'));
  },

  actions: {
    onDiscard() {
      this.loadMarkdown();
    },
    onSave() {
      const {
        share,
        currentMarkdown,
        globalNotify,
      } = this.getProperties('share', 'currentMarkdown', 'globalNotify');
      set(share, 'description', currentMarkdown);
      return share.save()
        .catch(error => {
          globalNotify.backendError(this.t('savingDescription'), error);
          throw error;
        });
    },
    startEdit() {
      this.setProperties({
        isEmptyDescriptionInfoVisible: false,
        editorMode: 'markdown',
      });
    },
  },
});
