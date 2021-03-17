/**
 * Main component for managing datasets for file or directory.
 * 
 * Currently used in file-browser wrapped with one-modal.
 *
 * @module components/file-datasets
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';

export default Component.extend(I18n, {
  classNames: ['file-datasets'],

  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets',

  /**
   * @virtual optional
   * @type {Boolean}
   */
  editPrivilege: true,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  close: notImplementedIgnore,

  /**
   * @virtual
   * Callback to generate URL to file (here: selecting the file).
   * See parent-action `getDataUrl` in `component:content-file-browser`
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * Text displayed in various places when settings cannot be edited due to lack of
   * privileges.
   * @type {ComputedProperty<SafeString>}
   */
  insufficientEditPrivilegesMessage: computed('editPrivilege',
    function insufficientEditPrivilegesMessage() {
      if (!this.get('editPrivilege')) {
        return insufficientPrivilegesMessage({
          i18n: this.get('i18n'),
          modelName: 'space',
          privilegeFlag: 'space_manage_datasets',
        });
      }
    }
  ),

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('files.firstObject'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isEffDataProtected: hasProtectionFlag('file.effProtectionFlags', 'data'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isEffMetadataProtected: hasProtectionFlag('file.effProtectionFlags', 'metadata'),

  // TODO: VFS-7402 use getRelation
  /**
   * @type {ComputedProperty<PromiseObject<Models.FileDatasetSummary>>}
   */
  fileDatasetSummaryProxy: reads('file.fileDatasetSummary'),

  /**
   * @type {ComputedProperty<Models.FileDatasetSummary>}
   */
  fileDatasetSummary: reads('fileDatasetSummaryProxy.content'),

  // TODO: VFS-7402 use getRelation or check belongsTo id
  hasDirectDatasetEstablished: reads('fileDatasetSummary.directDataset.content'),

  // TODO: VFS-7402 use getRelation
  /**
   * @type {ComputedProperty<PromiseArray<Models.Dataset>>}
   */
  inheritedDatasetsProxy: reads('fileDatasetSummary.effectiveDatasets'),

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  inheritedDatasets: reads('inheritedDatasetsProxy.content'),

  actions: {
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
  },
});
