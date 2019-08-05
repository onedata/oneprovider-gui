/**
 * Non-model server-side file procedures.
 * Currently file list fetching methods to use with infinite scroll list.
 * 
 * @module services/file-server
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, all } from 'rsvp';
import Evented from '@ember/object/evented';
import { get, computed } from '@ember/object';

export default Service.extend(Evented, {
  store: service(),
  onedataRpc: service(),

  fileClipboardMode: null,

  fileClipboardFiles: computed(() => ([])),

  fetchDirChildren(dirId, startFromIndex, size, offset) {
    const {
      store,
      onedataRpc,
    } = this.getProperties('store', 'onedataRpc');
    if (!size || size <= 0) {
      return resolve([]);
    } else {
      return onedataRpc
        .request('getDirChildren', {
          guid: dirId,
          index: startFromIndex,
          limit: size,
          offset,
        })
        .then(fileIds => all(fileIds.map(id => store.findRecord('file', id))));
    }
  },

  renameFile(fileEntityId, parentDirEntityId, targetName) {
    return this.get('onedataRpc').request('moveFile', {
      guid: fileEntityId,
      targetParentGuid: parentDirEntityId,
      targetName,
    });
  },

  copyFile(file, parentDirEntityId) {
    return this.copyOrMoveFile(file, parentDirEntityId, 'copy');
  },

  moveFile(file, parentDirEntityId) {
    return this.copyOrMoveFile(file, parentDirEntityId, 'move');
  },

  copyOrMoveFile(file, parentDirEntityId, operation) {
    const name = get(file, 'name');
    const entityId = get(file, 'entityId');
    return this.get('onedataRpc').request(`${operation}File`, {
      guid: entityId,
      targetParentGuid: parentDirEntityId,
      targetName: name,
    });
  },

  download(fileEntityId) {
    // FIXME: change download to work like in old op-gui-default
    this.get('onedataRpc').request('getFileDownloadUrl', {
      guid: fileEntityId,
    }).then(({ fileUrl }) => window.open(fileUrl, '_blank'));
  },
});
