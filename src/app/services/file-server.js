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
import { all } from 'rsvp';
import Evented from '@ember/object/evented';

export default Service.extend(Evented, {
  store: service(),
  onedataRpc: service(),

  fetchDirChildren(dirId, startFromIndex, size, offset) {
    const {
      store,
      onedataRpc,
    } = this.getProperties('store', 'onedataRpc');
    return onedataRpc
      .request('getDirChildren', {
        guid: dirId,
        index: startFromIndex,
        limit: size,
        offset,
      })
      .then(fileIds => all(fileIds.map(id => store.findRecord('file', id))));
  },
});
