/**
 * Control of dataset estabilished directly for some file/directory 
 *
 * @module components/file-dataset/direct-dataset-control
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { equal, reads } from '@ember/object/computed';
import { and, tag } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['direct-dataset-control'],

  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.directDatasetControl',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {PromiseObject<Models.Dataset>}
   */
  directDatasetProxy: undefined,

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
   * @type {ComputedProperty<Models.Dataset>}
   */
  directDataset: reads('directDatasetProxy.content'),

  /**
   * Valid only if `directDatasetProxy` resolves
   * @type {ComputedProperty<Boolean>}
   */
  isDatasetAttached: equal('directDataset.state', 'attached'),

  toggleId: tag `${'elementId'}-direct-dataset-attached-toggle`,

  async establishDirectDataset() {
    const {
      file,
      datasetManager,
      globalNotify,
    } = this.getProperties('file', 'datasetManager', 'globalNotify');
    try {
      return await datasetManager.establishDataset(file);
    } catch (error) {
      globalNotify.backendError(this.t('establishingDataset'), error);
    }
  },

  actions: {
    async toggleDatasetAttachment(state) {
      const {
        directDataset,
        datasetManager,
      } = this.getProperties('directDataset', 'datasetManager');
      if (directDataset) {
        return await datasetManager.toggleDatasetAttachment(directDataset, state);
      } else if (state) {
        return await this.establishDirectDataset();
      } else {
        return null;
      }
    },
    async destroyDataset() {
      const {
        datasetManager,
        directDataset,
        globalNotify,
      } = this.getProperties('datasetManager', 'directDataset', 'globalNotify');
      try {
        return await datasetManager.destroyDataset(directDataset);
      } catch (error) {
        globalNotify.backendError(this.t('destroyingDataset'), error);
      }
    },
  },
});
