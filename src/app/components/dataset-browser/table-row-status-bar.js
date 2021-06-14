/**
 * Implementation of status part of table row part for dataset-browser.
 *
 * @module components/dataset-browser/table-row-status-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowStatusBar from 'oneprovider-gui/components/file-browser/fb-table-row-status-bar';
import { or, and } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default FbTableRowStatusBar.extend({
  classNames: ['dataset-table-row-status-bar'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableRowStatusBar',

  // TODO: VFS-7643 "file" naming should be changed for generic browser
  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  dataset: reads('file'),

  /**
   * If set to true, tags will not provide actions on click.
   * @type {ComputedProperty<Boolean>}
   */
  disabled: reads('browserModel.disableStatusBar'),

  /**
   * If true, should display dataset tag
   * @type {ComputedProperty<Boolean>}
   */
  showProtectionTag: or(
    'dataIsEffProtected',
    'metadataIsEffProtected',
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsEffProtected: and(
    'dataset.isAttached',
    'dataset.dataIsEffProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsEffProtected: and(
    'dataset.isAttached',
    'dataset.metadataIsEffProtected'
  ),

  /**
   * Content for protection tag tooltip
   * @type {ComputedProperty<SafeString>}
   */
  protectionFlagsInfo: computed(
    'metadataIsEffProtected',
    'dataIsEffProtected',
    function protectionFlagsInfo() {
      const {
        metadataIsEffProtected,
        dataIsEffProtected,
      } = this.getProperties('metadataIsEffProtected', 'dataIsEffProtected');
      let translationKey;
      if (dataIsEffProtected && metadataIsEffProtected) {
        translationKey = 'both';
      } else if (dataIsEffProtected) {
        translationKey = 'data';
      } else if (metadataIsEffProtected) {
        translationKey = 'metadata';
      }
      if (translationKey) {
        return this.t(`protectionFlagsInfo.${translationKey}`);
      }

      return '';
    }
  ),
});
