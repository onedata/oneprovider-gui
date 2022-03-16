/**
 * Standalone component for creating archive using archive settings editor
 *
 * @module components/archive-create-modal
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { createPrivilegeExpression } from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { not } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

/**
 * @typedef {CreateArchiveOptions}
 * Start configuration for create archive modal.
 * @property {Utils.BrowsableArchive} [baseArchive] if provided, create modal will have
 *  incremental option enabled and locked, and this archive will be used as base archive
 */

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.archiveCreateModal',

  i18n: service(),

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
   * A dataset, for which archive will be created
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * Injected options for archive creation.
   * @virtual optional
   * @type {CreateArchiveOptions}
   */
  options: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * Should implement real archive create procedure, which resolves when archive record
   * is created and available to fetch.
   * @virtual
   * @type {Function}
   */
  onArchiveCreate: notImplementedReject,

  noViewArchivesPrivilege: not('space.privileges.viewArchives'),

  viewPrivilegeExpression: computed(function viewPrivilegeExpression() {
    const i18n = this.get('i18n');
    return createPrivilegeExpression(i18n, 'space', 'space_view_archives');
  }),

  actions: {
    hide() {
      this.get('onHide')();
    },
    submit(archiveData) {
      const {
        onArchiveCreate,
        dataset,
      } = this.getProperties('onArchiveCreate', 'dataset');
      return onArchiveCreate(dataset, archiveData);
    },
  },
});
