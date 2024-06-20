/**
 * Implementation of table first cell for archive-filesystem-browser.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadFirstCell from 'oneprovider-gui/components/file-browser/fb-table-head-first-cell';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { or, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default FbTableHeadFirstCell.extend({
  attributeBindings: ['colspan'],

  media: service(),

  /**
   * @type {ComputedProperty<number>}
   */
  colspan: computed('media.isMobile', function colspan() {
    return this.media.isMobile ? 2 : 1;
  }),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  renderArchiveDipSwitch: or(
    'browserModel.renderArchiveDipSwitch',
    raw(false)
  ),

  /**
   * One of: aip, dip.
   * @type {ComputedProperty<String>}
   */
  archiveDipMode: or(
    'browserModel.archiveDipMode',
    raw('aip')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isArchiveDipAvailable: or(
    'browserModel.isArchiveDipAvailable',
    raw(false),
  ),

  /**
   * @type {ComputedProperty<Function>}
   */
  onArchiveDipModeChange: or(
    'browserModel.onArchiveDipModeChange',
    raw(notImplementedThrow)
  ),
});
