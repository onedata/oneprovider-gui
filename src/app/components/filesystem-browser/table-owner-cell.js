/**
 * Filesystem - specific browser table cell for owner.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import layout from 'oneprovider-gui/templates/components/filesystem-browser/table-owner-cell';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  layout,
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableSizeCell',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<Models.User>>}
   */
  ownerProxy: promise.object(computed('file.owner', async function ownerProxy() {
    return await this.fileManager.getFileOwner(this.file);
  })),

  /**
   * @type {Models.User}
   */
  owner: reads('ownerProxy.content'),

  /**
   * @type {Object}
   */
  errorReasonForOwnerProxy: reads('ownerProxy.reason'),
});
