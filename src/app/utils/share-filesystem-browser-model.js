/**
 * Implementation of browser-model (logic and co-related data) for filesystem-browser
 * of shared files.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from './filesystem-browser-model';
import { get } from '@ember/object';
import { resolve } from 'rsvp';
import { promise } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';

export default FilesystemBrowserModel.extend({
  /**
   * @override
   */
  dirId: reads('browserContainerInstance.dirId'),

  /**
   * @override
   */
  async resolveDir() {
    const fallbackDir = await this.get('fallbackDirProxy');
    const dirItem = await this._super(...arguments);
    if (dirItem !== fallbackDir && await this.isChildOfShare(dirItem)) {
      return dirItem;
    } else {
      return fallbackDir;
    }
  },

  rootDir: reads('browserContainerInstance.rootDir'),

  /**
   * @override
   */
  fallbackDirProxy: promise.object(promise.resolve('rootDir')),

  share: reads('browserContainerInstance.share'),

  isChildOfShare(file) {
    return this.get('share.rootFile').then(shareRootFile => {
      const rootInternalId = get(shareRootFile, 'internalFileId');
      return this.checkOnPath(
        file,
        (currentFile) => get(currentFile, 'internalFileId') === rootInternalId);
    });
  },

  checkOnPath(file, condition = () => false) {
    if (file) {
      if (condition(file)) {
        return resolve(true);
      } else {
        const parentId = file.belongsTo('parent').id();
        if (parentId) {
          return get(file, 'parent').then(parent => this.checkOnPath(parent, condition));
        } else {
          return resolve(false);
        }
      }
    } else {
      return resolve(false);
    }
  },
});
