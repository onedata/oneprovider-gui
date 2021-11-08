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

export const onedataArchivesRootDirName = '.__onedata__archive';

export const onedataArchivesRootIndex = 1;

export const datasetDirIndex = 2;

export const archiveDirIndex = 3;

export default EmberObject.extend(OwnerInjector, {
  archiveManager: service(),

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  onedataArchivesRootDirName: '.__onedata__archive',

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
      const {
        onedataArchivesRootDirName,
        filePathProxy,
      } = this.getProperties(
        'onedataArchivesRootDirName',
        'filePathProxy'
      );
      const filePath = await filePathProxy;
      if (!isArray(filePath)) {
        return false;
      }

      const lastIndex = get(filePath, 'length') - 1;
      return lastIndex >= archiveDirIndex &&
        get(filePath[onedataArchivesRootIndex], 'name') === onedataArchivesRootDirName;
    }
  )),

  isSpecialHiddenDirProxy: promise.object(computed(
    'filePathProxy',
    async function isSpecialHiddenDirProxy() {
      const {
        onedataArchivesRootDirName,
        filePathProxy,
      } = this.getProperties(
        'onedataArchivesRootDirName',
        'filePathProxy'
      );
      const filePath = await filePathProxy;
      if (!isArray(filePath)) {
        return null;
      }

      const lastIndex = get(filePath, 'length') - 1;
      const lastFileType = get(filePath[lastIndex], 'type');
      return lastFileType === 'dir' && (
        lastIndex >= onedataArchivesRootIndex && lastIndex <= archiveDirIndex &&
        get(filePath[onedataArchivesRootIndex], 'name') === onedataArchivesRootDirName
      );
    }
  )),

  datasetIdProxy: promise.object(computed(
    'filePathProxy',
    async function datasetIdProxy() {
      const filePath = await this.get('filePathProxy');
      if (!isArray(filePath)) {
        return null;
      }

      const lastIndex = get(filePath, 'length') - 1;
      const name = lastIndex >= datasetDirIndex &&
        get(filePath[datasetDirIndex], 'name') || null;
      return this.getDatasetIdFromDirName(name);
    }
  )),

  archiveIdProxy: promise.object(computed(
    'filePathProxy',
    async function archiveIdProxy() {
      const filePath = await this.get('filePathProxy');
      if (!isArray(filePath)) {
        return null;
      }
      const lastIndex = get(filePath, 'length') - 1;
      const name = lastIndex >= archiveDirIndex &&
        get(filePath[archiveDirIndex], 'name') || null;
      return this.getArchiveIdFromDirName(name);
    }
  )),

  archiveRelativeFilePathProxy: promise.object(computed(
    'isInArchiveProxy',
    'filePathProxy',
    async function archiveRelativeFilePathProxy() {
      if (!(await this.get('isInArchiveProxy'))) {
        return null;
      }
      const filePath = await this.get('filePathProxy');

      return this.getArchiveRelativeFilePath(filePath);
    }
  )),

  getArchiveRelativeFilePath,
  getArchiveIdFromDirName,
  getDatasetIdFromDirName,
});

export function getArchiveIdFromDirName(dirName) {
  const m = dirName && dirName.match('^archive_(.*)');
  return m && m[1] || null;
}

export function getDatasetIdFromDirName(dirName) {
  const m = dirName && dirName.match('^dataset_archives_(.*)');
  return m && m[1] || null;
}

/**
 * @param {Array<Models.File>} path
 * @returns {Array<Models.File>}
 */
export function getArchiveRelativeFilePath(path) {
  return path.slice(archiveDirIndex + 1);
}
