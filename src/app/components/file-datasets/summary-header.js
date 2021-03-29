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
import { or, raw, conditional } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
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

  /**
   * Note: fileDatasetSummary can be updated more frequently, so if is already available
   * then use its protection value.
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtectedForFile: conditional(
    'fileDatasetSummaryProxy.isFulfilled',
    'fileDatasetSummary.dataIsProtected',
    'file.dataIsProtected',
  ),

  /**
   * Note: fileDatasetSummary can be updated more frequently, so if is already available
   * then use its protection value.
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtectedForFile: conditional(
    'fileDatasetSummaryProxy.isFulfilled',
    'fileDatasetSummary.metadataIsProtected',
    'file.metadataIsProtected',
  ),
});
