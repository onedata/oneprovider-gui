import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { array, raw } from 'ember-awesome-macros';
// import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-datasets'],

  datasetManager: service(),

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
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

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
  isEffDataProtected: array.includes(
    'file.effProtectionFlags',
    raw('data_protection')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isEffMetadataProtected: array.includes(
    'file.effProtectionFlags',
    raw('metadata_protection')
  ),

  // TODO: VFS-7402 change to getRelation
  fileDatasetSummaryProxy: reads('file.fileDatasetSummary'),

  fileDatasetSummary: reads('fileDatasetSummaryProxy.content'),

  // TODO: VFS-7402 change to getRelation or check belongsTo id
  hasDirectDatasetEstablished: reads('fileDatasetSummary.directDataset.content'),

  inheritedDatasetsProxy: reads('fileDatasetSummary.effectiveDatasets'),

  inheritedDatasets: reads('inheritedDatasetsProxy.content'),

  actions: {
    async establishDirectDataset() {
      const {
        file,
        datasetManager,
      } = this.getProperties('file', 'datasetManager');
      await datasetManager.establishDataset(file);
    },
  },
});
