/**
 * @module models/space
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

export const entityType = 'op_space';

export default Model.extend(
  GraphSingleModelMixin,
  createDataProxyMixin('transfersActiveChannels'), {
    transferManager: service(),

    name: attr('string'),
    rootDir: belongsTo('file'),
    providerList: belongsTo('provider-list'),
    effUserList: belongsTo('user-list'),
    effGroupList: belongsTo('group-list'),

    /**
     * @override
     */
    fetchTransfersActiveChannels() {
      return this.get('transferManager').getSpaceTransfersActiveChannels(this);
    },

    // FIXME: remove from here
    /**
     * Fetch partial list of space transfer records.
     * Implements 
     * @param {String} state one of: waiting, ongoing, ended
     * @param {String} startFromIndex
     * @param {Number} size
     * @param {Number} offset
     * @returns {Promise<object>} promise of backend request with transfers list
     */
    fetchTransfers(state, startFromIndex, size, offset) {
      const transferManager = this.get('transferManager');
      const space = this;
      return transferManager.getTransfersForSpace(
        space,
        state,
        startFromIndex,
        size,
        offset
      );
    },
  }
).reopenClass(StaticGraphModelMixin);
