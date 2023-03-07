/**
 * Standalone component for creating archive using archive settings editor
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
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

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveCreateModal',

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
