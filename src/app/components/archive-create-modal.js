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

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * A dataset, for which archive will be created
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

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
