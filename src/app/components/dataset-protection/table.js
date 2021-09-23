/**
 * FIXME: jsdoc, virtual properties jsdoc
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

  i18nPrefix: 'components.datasetProtection.table',

  fileDatasetSummaryProxy: undefined,

  directDatasetProxy: undefined,

  file: undefined,

  editPrivilege: undefined,

  insufficientEditPrivilegesMessage: undefined,

  close: undefined,

  mode: undefined,

  getDataUrl: undefined,

  getDatasetsUrl: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  showBrowseDatasetsLink: true,

  /**
   * @type {ComputedProperty<PromiseArray<Models.Dataset>>}
   */
  ancestorDatasetsProxy: promise.array(computed(
    'fileDatasetSummaryProxy',
    async function ancestorDatasetsProxy() {
      const fileDatasetSummary = await this.get('fileDatasetSummaryProxy');
      return await fileDatasetSummary.hasMany('effAncestorDatasets').reload();
    }
  )),

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
      if (invokingDataset) {
        const datasetParentRelation = directDataset.belongsTo('parent');
        promises.push(datasetParentRelation.reload());
        promises.push(fileManager.fileParentRefresh(directDataset));
      }
      await allFulfilled(promises);
    },
  },
});
