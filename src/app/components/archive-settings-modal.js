/**
 * Standalone component for viewing and editing archive properties using archive settings
 * editor.
 *
 * @module components/archive-settings-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { createPrivilegeExpression } from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { conditional, and, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettingsModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * An archive for which info will be displayed or modified.
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  archive: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * Notifies about successful archive modification.
   * @virtual optional
   * @type {(archive: Models.Archive) => Promise}
   */
  onArchiveModified: notImplementedIgnore,

  hasEditPrivileges: and(
    'space.privileges.manageDatasets',
    'space.privileges.viewArchives'
  ),

  mode: conditional(
    'hasEditPrivileges',
    raw('edit'),
    raw('show'),
  ),

  // FIXME: unused
  viewPrivilegeExpression: computed(function viewPrivilegeExpression() {
    const i18n = this.get('i18n');
    return createPrivilegeExpression(
      i18n,
      'space',
      ['space_manage_datasets', 'space_view_archives']
    );
  }),

  async modifyArchive() {
    const {
      globalNotify,
      archiveManager,
      archive,
      onArchiveModified,
      currentArchiveData,
    } = this.getProperties(
      'globalNotify',
      'archiveManager',
      'archive',
      'onArchiveModified',
      'currentArchiveData',
    );
    // FIXME: implement currnetArchiveData modification
    let result;
    try {
      result = await archiveManager.modifyArchive(archive, currentArchiveData);
    } catch (error) {
      globalNotify.backendError(this.t('updatingArchive'), error);
      throw error;
    }
    try {
      await onArchiveModified(result);
    } catch (error) {
      console.warn(
        'component:archive-settings-modal#modifyArchive: onArchiveModified callback failed',
        error
      );
    }
    return result;
  },

  actions: {
    hide() {
      this.get('onHide')();
    },
    submit() {
      return this.modifyArchive();
    },
  },
});
