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

export const oneArchivesRootDirName = '.__onedata__archive';

export const oneArchivesRootPathPosition = 1;

export const datasetDirPathPosition = 2;

export const archiveDirPathPosition = 3;

export default EmberObject.extend(OwnerInjector, {
  archiveManager: service(),

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  oneArchivesRootDirName,

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
        oneArchivesRootDirName,
        filePathProxy,
      } = this.getProperties(
        'oneArchivesRootDirName',
        'filePathProxy'
      );
      const filePath = await filePathProxy;
      if (!isArray(filePath)) {
        return false;
      }

      const lastIndex = get(filePath, 'length') - 1;
      return lastIndex >= archiveDirPathPosition &&
        get(filePath[oneArchivesRootPathPosition], 'name') === oneArchivesRootDirName;
    }
  )),

  isSpecialHiddenDirProxy: promise.object(computed(
    'filePathProxy',
    async function isSpecialHiddenDirProxy() {
      const {
        oneArchivesRootDirName,
        filePathProxy,
      } = this.getProperties(
        'oneArchivesRootDirName',
        'filePathProxy'
      );
      const filePath = await filePathProxy;
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
      const filePath = await this.get('filePathProxy');
      if (!isArray(filePath)) {
        return null;
      }

      const lastIndex = get(filePath, 'length') - 1;
      const name = lastIndex >= datasetDirPathPosition &&
        get(filePath[datasetDirPathPosition], 'name') || null;
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
      const name = lastIndex >= archiveDirPathPosition &&
        get(filePath[archiveDirPathPosition], 'name') || null;
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
  return path.slice(archiveDirPathPosition + 1);
}
