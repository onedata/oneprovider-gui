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
import cutDirsPath from 'oneprovider-gui/utils/cut-dirs-path';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';

export default EmberObject.extend(OwnerInjector, {
  archiveManager: service(),

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  onedataArchivesRootDirName: '.__onedata__archive',

  filePathProxy: promise.object(computed('file.parent', function filePathProxy() {
    const file = this.get('file');
    return file && resolveFilePath(file);
  })),

  isInArchiveProxy: promise.object(computed(
    'filePathProxy',
    async function archiveIdProxy() {
      const onedataArchivesRootDirName = this.get('onedataArchivesRootDirName');
      const filePath = await this.get('filePathProxy');
      if (!isArray(filePath)) {
        return null;
      }

      return get(filePath, 'length') >= 2 &&
        get(filePath[1], 'name') === onedataArchivesRootDirName;
    }
  )),

  datasetIdProxy: promise.object(computed(
    'filePathProxy',
    async function archiveIdProxy() {
      const filePath = await this.get('filePathProxy');
      if (!isArray(filePath)) {
        return null;
      }

      const name = get(filePath, 'length') >= 3 && get(filePath[2], 'name') || null;
      return this.getArchiveIdFromDirName(name);
    }
  )),

  archiveIdProxy: promise.object(computed(
    'filePathProxy',
    async function archiveIdProxy() {
      const filePath = await this.get('filePathProxy');
      if (!isArray(filePath)) {
        return null;
      }

      const name = get(filePath, 'length') >= 4 && get(filePath[3], 'name') || null;
      return this.getArchiveIdFromDirName(name);
    }
  )),

  archiveRelativeFilePathProxy: promise.object(computed(
    'isInArchiveProxy',
    'archiveIdProxy',
    'filePathProxy',
    async function archiveIdProxy() {
      if (!(await this.get('isInArchiveProxy'))) {
        return null;
      }
      const filePath = await this.get('filePathProxy');
      const archiveId = await this.get('archiveIdProxy');
      if (!archiveId) {
        return null;
      }
      try {
        const archive = await this.get('archiveManager').getArchive(archiveId);
        const archiveRootDirId = archive.relationEntityId('rootDir');
        const archiveRootDir = filePath.findBy('entityId', archiveRootDirId);
        return cutDirsPath(filePath, archiveRootDir);
      } catch (error) {
        return null;
      }
    }
  )),

  getArchiveIdFromDirName,
  getDatasetIdFromDirName,
});

export function getArchiveIdFromDirName(dirName) {
  return dirName && dirName.split('archive_')[1] || null;
}

export function getDatasetIdFromDirName(dirName) {
  return dirName && dirName.split('dataset_archives_')[1] || null;
}
