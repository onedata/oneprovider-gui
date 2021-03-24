/**
 * Basic information about datasets in context of selected file, eg. file name and
 * effective write protections flags. In practice, this is a modal header.
 *
 * @module components/file-datasets/summary-header
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { or, raw } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['file-datasets-summary-header'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.summaryHeader',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  fileType: or('file.type', raw('file')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtectedForFile: hasProtectionFlag('file.effProtectionFlags', 'data'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtectedForFile: hasProtectionFlag('file.effProtectionFlags', 'metadata'),
});
