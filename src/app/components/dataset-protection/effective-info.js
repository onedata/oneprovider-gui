/**
 * Shows effective write protection info (final summary of protection).
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, or, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import protectionIcons from 'oneprovider-gui/utils/dataset-protection/protection-icons';

export default Component.extend(I18n, {
  classNames: [
    'modal-header-effective-info',
    'header-tags-container',
    'datasets-effective-protection-info',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetProtection.effectiveInfo',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * One of: file, dataset
   * @virtual optional
   */
  mode: 'file',

  /**
   * Mapping of protection type (data or metadata) to name of icon representing it
   * @type {Object}
   */
  protectionIcons,

  /**
   * @type {ComputedProperty<String>}
   */
  fileType: or('file.type', raw('file')),

  /**
   * @type {ComputedProperty<PromiseObject<Models.FileDatasetSummary>>}
   */
  fileDatasetSummaryProxy: computedRelationProxy(
    'file',
    'fileDatasetSummary',
    Object.freeze({
      reload: true,
      computedRelationErrorProperty: 'fileDatasetSummaryLoadError',
    })
  ),

  /**
   * @type {ComputedProperty<Models.FileDatasetSummary>}
   */
  fileDatasetSummary: reads('fileDatasetSummaryProxy.content'),

  // FIXME: custom property use

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
