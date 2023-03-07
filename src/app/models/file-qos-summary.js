/**
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

    /**
     * - Keys: qos requirement entity ids
     * - Values: one of: fulfilled, pending, impossible
     * @type {ComputedProperty<Object>}
     */
    requirements: attr('object'),

    status: computed('requirements.[]', function status() {
      const statusesSet = new Set(Object.values(this.get('requirements')));
      return statusesSet.has('impossible') && 'impossible' ||
        statusesSet.has('pending') && 'pending' ||
        statusesSet.has('fulfilled') && statusesSet.size === 1 && 'fulfilled' ||
        'error';
    }),

    /**
     * @override
     */
    fetchQosRecords() {
      const {
        requirements,
        scope,
        qosManager,
      } = this.getProperties('requirements', 'scope', 'qosManager');
      return allFulfilled(Object.keys(requirements).map(qosId =>
        qosManager.getRecordById(qosId, scope)
      ));
    },
  }
).reopenClass(StaticGraphModelMixin);
