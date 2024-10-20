/**
 * Information about selected dataset and its effective write protection.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['dataset-protection-summary-header', 'header-with-tags'],

  i18nPrefix: 'components.datasetProtection.summaryHeader',

  /**
   * @virtual
   * @type {Utils.BrowsableDataset}
   */
  dataset: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,
});
