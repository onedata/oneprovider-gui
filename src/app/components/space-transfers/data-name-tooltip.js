/**
 * A detailed information about transferred object (eg. file) rendered in tooltip.
 *
 * @module space-transfers/data-name-tooltip
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { getArchiveRelativeFilePath } from 'oneprovider-gui/utils/file-archive-info';
import { stringifyFilePath, dirSeparator } from 'oneprovider-gui/utils/resolve-file-path';
import { computed, get, getProperties } from '@ember/object';
import { promise, raw, array, equal } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  datasetManager: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.dataNameTooltip',

  /**
   * @virtual
   * @type {Utils.TransferTableRecord}
   */
  record: undefined,

  /**
   * @virtual optional
   * @type {String}
   */
  customClass: '',

  /**
   * Passed to one-tooltip's placement property.
   * @type {String}
   */
  placement: 'bottom',

  dataSourceType: reads('record.transfer.dataSourceType'),
  dataSourceName: reads('record.transfer.dataSourceName'),

  isFileDeleted: equal('dataSourceType', raw('deleted')),

  deletedIsDir: computed('affectedFiles', function deletedIsDir() {
    const affectedFiles = this.get('affectedFiles');
    return Boolean(affectedFiles) && affectedFiles > 1;
  }),

  /**
   * @type {Ember.ComputedProperty<Number>}
   */
  affectedFiles: computed(
    'record.{replicatedFiles,evictedFiles}',
    function affectedFiles() {
      const {
        replicatedFiles,
        evictedFiles,
      } = getProperties(this.get('record'), 'replicatedFiles', 'evictedFiles');
      return (replicatedFiles + evictedFiles) || 0;
    }
  ),

  isFileSource: array.includes(raw(['file', 'dir', 'deleted']), 'dataSourceType'),

  filePath: computed('dataSourceName', function filePath() {
    const fileNames = this.get('dataSourceName').split(dirSeparator).slice(1);
    return fileNames.map(fileName => ({
      name: fileName,
    }));
  }),

  fileArchiveInfoProxy: computed(
    'dataSourceType',
    'isFileSource',
    'filePath',
    function fileArchiveInfoProxy() {
      const {
        isFileSource,
        filePath,
      } = this.getProperties(
        'isFileSource',
        'filePath',
      );
      if (!isFileSource) {
        return null;
      }
      return FileArchiveInfo.create({
        ownerSource: this,
        filePathProxy: promiseObject(resolve(filePath)),
      });
    }
  ),

  isInArchive: reads('fileArchiveInfoProxy.isInArchiveProxy.content'),

  displayedFilePath: computed(
    'dataSourceName',
    'isInArchive',
    'filePath.[]',
    function displayedFilePath() {
      const {
        dataSourceName,
        isInArchive,
        filePath,
      } = this.getProperties(
        'dataSourceName',
        'filePath',
        'isInArchive',
      );
      if (isInArchive) {
        return stringifyFilePath(getArchiveRelativeFilePath(filePath));
      } else {
        return dataSourceName;
      }
    }
  ),

  displayedDatasetNameProxy: promise.object(computed(
    'fileArchiveInfoProxy',
    async function displayedDatasetName() {
      const {
        fileArchiveInfoProxy,
        datasetManager,
      } = this.getProperties('fileArchiveInfoProxy', 'datasetManager');
      const fileArchiveInfo = await fileArchiveInfoProxy;
      let datasetName = null;
      try {
        const datasetId = await get(fileArchiveInfo, 'datasetIdProxy');
        datasetName = datasetId;
        const dataset = await datasetManager.getBrowsableDataset(datasetId);
        if (dataset) {
          datasetName = get(dataset, 'name') || datasetName;
        }
        return datasetName;
      } catch (error) {
        return datasetName;
      }
    }
  )),

  displayedDatasetName: reads('displayedDatasetNameProxy.content'),

  displayedArchiveNameProxy: promise.object(computed(
    'fileArchiveInfoProxy',
    async function displayedDatasetName() {
      const {
        fileArchiveInfoProxy,
        archiveManager,
      } = this.getProperties('fileArchiveInfoProxy', 'archiveManager');
      const fileArchiveInfo = await fileArchiveInfoProxy;
      let archiveName = null;
      try {
        const archiveId = await get(fileArchiveInfo, 'archiveIdProxy');
        archiveName = archiveId;
        const archive = await archiveManager.getBrowsableArchive(archiveId);
        if (archive) {
          archiveName = get(archive, 'name') || archiveName;
        }
        return archiveName;
      } catch (error) {
        return archiveName;
      }
    }
  )),

  displayedArchiveName: reads('displayedArchiveNameProxy.content'),

  dataSourceTypeLabelKey: computed(
    'dataSourceType',
    function displayedDataSourceType() {
      const dataSourceType = this.get('dataSourceType');
      if (dataSourceType === 'deleted') {
        return this.get('deletedIsDir') ? 'dir' : 'file';
      } else {
        return dataSourceType;
      }
    }
  ),
});
