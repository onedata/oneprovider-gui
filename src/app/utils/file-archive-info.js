/**
 * Class for creating objects providing info about file membership in archive and
 * dataset. Info is currently obtained in a hacky way, because backend lacks API.
 *
 * @module utils/file-archive-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, get } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import resolveFilePath from 'oneprovider-gui/utils/resolve-file-path';
import { isArray } from '@ember/array';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import { all as allFulfilled } from 'rsvp';

export const oneArchivesRootDirName = '.__onedata__archive';

export const oneArchivesRootPathPosition = 1;

export const datasetDirPathPosition = 2;

export const archiveDirPathPosition = 3;

export default EmberObject.extend(OwnerInjector, {
  datasetManager: service(),
  archiveManager: service(),
  appProxy: service(),

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * An array of file objects that makes an absolute path to file.
   * @type {Array<Models.File>} array of file-like objects
   */
  filePathProxy: promise.object(computed('file.parent', function filePathProxy() {
    const file = this.get('file');
    return file && resolveFilePath(file);
  })),

  isInArchiveProxy: promise.object(computed(
    'filePathProxy',
    async function archiveIdProxy() {
      const filePath = await this.filePathProxy;
      return getIsInArchivePath(filePath);
    }
  )),

  isSpecialHiddenDirProxy: promise.object(computed(
    'filePathProxy',
    async function isSpecialHiddenDirProxy() {
      const filePath = await this.filePathProxy;
      if (!isArray(filePath)) {
        return null;
      }

      const lastIndex = get(filePath, 'length') - 1;
      const lastFileType = get(filePath[lastIndex], 'type');
      return lastFileType === 'dir' && (
        lastIndex >= oneArchivesRootPathPosition && lastIndex <= archiveDirPathPosition &&
        get(filePath[oneArchivesRootPathPosition], 'name') === oneArchivesRootDirName
      );
    }
  )),

  datasetIdProxy: promise.object(computed(
    'filePathProxy',
    async function datasetIdProxy() {
      const filePath = await this.filePathProxy;
      if (!isArray(filePath)) {
        return null;
      }

      const lastIndex = get(filePath, 'length') - 1;
      const name = lastIndex >= datasetDirPathPosition &&
        get(filePath[datasetDirPathPosition], 'name') || null;
      return getDatasetIdFromDirName(name);
    }
  )),

  archiveIdProxy: promise.object(computed(
    'filePathProxy',
    async function archiveIdProxy() {
      const filePath = await this.filePathProxy;
      if (!isArray(filePath)) {
        return null;
      }
      return getArchiveIdFromPath(filePath);
    }
  )),

  archiveRelativeFilePathProxy: promise.object(computed(
    'isInArchiveProxy',
    'filePathProxy',
    async function archiveRelativeFilePathProxy() {
      if (!(await this.isInArchiveProxy)) {
        return null;
      }
      const filePath = await this.filePathProxy;

      return getArchiveRelativeFilePath(filePath);
    }
  )),

  archiveProxy: promise.object(computed(
    'isInArchiveProxy',
    'archiveIdProxy',
    async function archiveProxy() {
      if (!(await this.isInArchiveProxy)) {
        return null;
      }
      const archiveId = await this.archiveIdProxy;
      if (!archiveId) {
        return null;
      }

      return this.archiveManager.getArchive(archiveId);
    }
  )),

  datasetProxy: promise.object(computed(
    'isInArchiveProxy',
    'datasetIdProxy',
    async function archiveProxy() {
      if (!(await this.isInArchiveProxy)) {
        return null;
      }
      const datasetId = await this.datasetIdProxy;
      if (!datasetId) {
        return null;
      }

      return this.datasetManager.getDataset(datasetId);
    }
  )),

  browsableArchiveProxy: promise.object(computed(
    'archiveProxy',
    async function browsableArchiveProxy() {
      const {
        archiveProxy,
        archiveManager,
      } = this.getProperties(
        'archiveProxy',
        'archiveManager',
      );
      const archive = await archiveProxy;
      if (archive) {
        return archiveManager.getBrowsableArchive(archive);
      } else {
        return null;
      }
    }
  )),

  browsableDatasetProxy: promise.object(computed(
    'datasetProxy',
    async function browsableDatasetProxy() {
      const {
        datasetProxy,
        datasetManager,
      } = this.getProperties(
        'datasetProxy',
        'datasetManager',
      );
      const dataset = await datasetProxy;
      if (dataset) {
        return datasetManager.getBrowsableDataset(dataset);
      } else {
        return null;
      }
    }
  )),

  datasetUrlProxy: promise.object(computed(
    'datasetProxy',
    async function datasetUrlProxy() {
      const {
        datasetProxy,
        appProxy,
      } = this.getProperties('datasetProxy', 'appProxy');

      const dataset = await datasetProxy;
      if (!dataset) {
        return null;
      }

      const datasetId = get(dataset, 'entityId');
      if (!datasetId) {
        return null;
      }

      return appProxy.callParent('getDatasetsUrl', {
        archive: null,
        dir: null,
        selectedDatasets: [datasetId],
      });
    }
  )),

  archiveUrlProxy: promise.object(computed(
    'archiveProxy',
    'datasetProxy',
    async function archiveUrlProxy() {
      const {
        archiveProxy,
        datasetProxy,
        appProxy,
      } = this.getProperties('archiveProxy', 'datasetProxy', 'appProxy');

      const [archive, dataset] = await allFulfilled([archiveProxy, datasetProxy]);
      if (!archive) {
        return null;
      }

      const archiveId = get(archive, 'entityId');
      const datasetId = dataset && get(dataset, 'entityId');

      if (!archiveId) {
        return null;
      }

      return appProxy.callParent('getDatasetsUrl', {
        archive: null,
        dir: null,
        selectedArchives: [archiveId],
        selectedDatasets: datasetId ? [datasetId] : null,
      });
    }
  )),
});

/**
 * @param {Array<Models.File>} path
 * @returns {boolean}
 */
export function getIsInArchivePath(filePath) {
  if (!isArray(filePath)) {
    return false;
  }
  const lastIndex = get(filePath, 'length') - 1;
  return lastIndex >= archiveDirPathPosition &&
    get(filePath[oneArchivesRootPathPosition], 'name') === oneArchivesRootDirName;
}

export function getArchiveIdFromDirName(dirName) {
  const m = dirName && dirName.match('^archive_(.*)');
  return m && m[1] || null;
}

export function getDatasetIdFromDirName(dirName) {
  const m = dirName && dirName.match('^dataset_archives_(.*)');
  return m && m[1] || null;
}

/**
 * @param {Array<{name: string}>} filePath
 * @returns {boolean}
 */
export function getArchiveIdFromPath(filePath) {
  const lastIndex = get(filePath, 'length') - 1;
  const name = lastIndex >= archiveDirPathPosition &&
    get(filePath[archiveDirPathPosition], 'name') || null;
  return getArchiveIdFromDirName(name);
}

/**
 * @param {Array<Models.File>} path Absolute path of file (must start with space root).
 * @returns {Array<Models.File>}
 */
export function getArchiveRelativeFilePath(path) {
  return path.slice(archiveDirPathPosition + 1);
}
