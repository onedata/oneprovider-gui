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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { or, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['file-datasets-summary-header', 'header-with-tags'],

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
   * One of: file, dataset.
   * - file: suitable for filesystem-browser
   * - dataset: suitable for dataset-browser
   * @virtual optional
   * @type {String}
   */
  mode: 'file',

  /**
   * @virtual
   * @type {PromiseObject<Models.FileDatasetSummary>}
   */
  fileDatasetSummaryProxy: undefined,

  /**
   * @type {ComputedProperty<Models.FileDatasetSummary>}
   */
  fileDatasetSummary: reads('fileDatasetSummaryProxy.content'),

  /**
   * @type {ComputedProperty<String>}
   */
  fileType: or('file.type', raw('file')),
});
