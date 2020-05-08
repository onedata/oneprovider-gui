/**
 * @module models/file-qos-summary
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { computed } from '@ember/object';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { all as allFulfilled } from 'rsvp';

export default Model.extend(
  GraphSingleModelMixin,
  createDataProxyMixin('qosRecords', { type: 'array' }), {
    qosManager: service(),

    entries: attr('object'),

    fulfilled: computed('entries.[]', function fulfilled() {
      return Object.values(this.get('entries')).every(entry => entry === true);
    }),

    /**
     * @override
     */
    fetchQosRecords() {
      const {
        entries,
        scope,
        qosManager,
      } = this.getProperties('entries', 'scope', 'qosManager');
      return allFulfilled(Object.keys(entries).map(qosId =>
        qosManager.getRecordById(qosId, scope)
      ));
    },
  }
).reopenClass(StaticGraphModelMixin);
