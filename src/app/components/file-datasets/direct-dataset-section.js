/**
 * Control of dataset estabilished directly for some file/directory 
 *
 * @module components/file-dataset/direct-dataset-section
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads, equal } from '@ember/object/computed';
import { and } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Component.extend(I18n, {
  classNames: ['direct-dataset-section'],

  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.directDatasetSection',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Models.FileDatasetSummary}
   */
  fileDatasetSummary: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {SafeString}
   */
  readonlyMessage: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  directDatasetProxy: computedRelationProxy(
    'fileDatasetSummary',
    'directDataset',
    Object.freeze({
      allowNull: true,
      reload: true,
    })
  ),

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  directDataset: reads('directDatasetProxy.content'),

  /**
   * Valid only if `directDatasetProxy` resolves
   * @type {ComputedProperty<Boolean>}
   */
  isDatasetAttached: equal('directDataset.state', 'attached'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDataProtected: and(
    'isDatasetAttached',
    hasProtectionFlag('directDataset.protectionFlags', 'data')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isMetadataProtected: and(
    'isDatasetAttached',
    hasProtectionFlag('directDataset.protectionFlags', 'metadata')
  ),

  actions: {
    toggleDatasetAttachment(state) {
      const {
        directDataset,
        datasetManager,
      } = this.getProperties('directDataset', 'datasetManager');
      return datasetManager.toggleDatasetAttachment(directDataset, state);
    },
    toggleDatasetProtectionFlag(flag, state) {
      const {
        directDataset,
        datasetManager,
      } = this.getProperties('directDataset', 'datasetManager');
      return datasetManager.toggleDatasetProtectionFlags(directDataset, {
        [flag]: state,
      });
    },
    async destroyDataset() {
      const {
        datasetManager,
        file,
        globalNotify,
      } = this.getProperties('datasetManager', 'file', 'globalNotify');
      try {
        return await datasetManager.destroyDataset(file);
      } catch (error) {
        globalNotify.backendError(this.t('destroyingDataset'), error);
      }
    },
  },
});
