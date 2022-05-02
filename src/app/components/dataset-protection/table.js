/**
 * Table listing selected and ancestor datasets with toggles for changing their write
 * protection settings. Can be used in two modes:
 * - file: suitable for filesystem browser
 * - dataset: suitable for dataset browser
 *
 * @module components/dataset-protection/table
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed, get } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { all as allFulfilled } from 'rsvp';

export default Component.extend(I18n, {
  classNames: ['dataset-protection-table'],

  i18n: service(),
  media: service(),
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.datasetProtection.table',

  /**
   * @virtual
   * @type {PromiseObject<Models.FielDatasetSummary>}
   */
  fileDatasetSummaryProxy: undefined,

  /**
   * @virtual
   * @type {PromiseObject<Utils.BrowsableDataset>}
   */
  directDatasetProxy: undefined,

  /**
   * Selected file in file mode or `rootDir` of selected dataset in dataset mode.
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  editPrivilege: undefined,

  /**
   * Text displayed in various places when settings cannot be edited due to lack of
   * privileges.
   * @type {ComputedProperty<SafeString>}
   */
  insufficientEditPrivilegesMessage: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  close: undefined,

  /**
   * One of: file, dataset.
   * - file: suitable for filesystem-browser, show info about ancestors
   *     in filesystem context
   * - dataset: suitable for dataset-browser, show info about ancestors
   *     in dataset tree context
   * @virtual optional
   * @type {String}
   */
  mode: undefined,

  getDataUrl: undefined,

  getDatasetsUrl: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  showBrowseDatasetsLink: true,

  // FIXME: property jsdoc
  ancestorDatasetsProxy: undefined,

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  ancestorDatasets: reads('ancestorDatasetsProxy.content'),

  actions: {
    /**
     * Update information about file currently opened in `file-datasets` component
     * @param {Object} options
     * @param {Models.File} options.fileInvokingUpdate file whose datasets changes caused
     *   invocation of this update - if this is the file opened in `file-datasets` or
     *   its direct parent, then we skip the refresh, because updates are automatically
     *   done by file-manager on this "invoking" file
     */
    async updateOpenedFileData({ fileInvokingUpdate } = {}) {
      const {
        fileManager,
        file,
      } = this.getProperties('fileManager', 'file');
      if (!file || fileInvokingUpdate === file) {
        return;
      }
      const fileDatasetSummaryRelation = file.belongsTo('fileDatasetSummary');
      const promises = [
        file.reload(),
        fileDatasetSummaryRelation.reload(),
        fileManager.dirChildrenRefresh(get(file, 'entityId')),
      ];
      // refresh opened file parent and its children only if invoker is not this parent
      const parentRelation = file.belongsTo('parent');
      if (get(fileInvokingUpdate, 'id') !== parentRelation.id()) {
        promises.push(parentRelation.reload());
        promises.push(fileManager.fileParentRefresh(file));
      }

      const invokingDatasetSummary =
        await get(fileInvokingUpdate, 'fileDatasetSummary');
      const invokingDataset = invokingDatasetSummary &&
        await get(invokingDatasetSummary, 'directDataset');
      const directDataset = await this.get('directDatasetProxy');
      if (directDataset && invokingDataset) {
        const datasetParentRelation = directDataset.belongsTo('parent');
        promises.push(datasetParentRelation.reload());
        promises.push(fileManager.fileParentRefresh(directDataset));
      }
      await allFulfilled(promises);
    },
  },
});
