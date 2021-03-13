import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { array, raw, and } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

const mixins = [
  I18n,
  createDataProxyMixin('directDataset'),
];

export default Component.extend(...mixins, {
  classNames: ['direct-dataset-section'],

  datasetManager: service(),

  i18nPrefix: 'components.fileDatasets.directDatasetSection',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * // TODO: VFS-7402 implement model type
   * @virtual
   * @type {Models.FileDatasetSummary}
   */
  fileDatasetSummary: undefined,

  directDatasetProxy: reads('fileDatasetSummary.directDataset'),

  directDataset: reads('directDatasetProxy.content'),

  /**
   * Valid only if `directDatasetProxy` resolves
   * @type {ComputedProperty<Boolean>}
   */
  isDatasetAttached: reads('directDataset.attached'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDataProtected: and('isDatasetAttached', array.includes(
    'directDataset.protectionFlags',
    raw('data_protection')
  )),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isMetadataProtected: and('isDatasetAttached', array.includes(
    'directDataset.protectionFlags',
    raw('metadata_protection')
  )),

  /**
   * // TODO: VFS-7402 implement model type
   * @override
   * @returns {PromiseObject<Models.Dataset>}
   */
  fetchDirectDataset() {
    return this.get('fileDatasetSummary.directDataset');
  },

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
  },
});
