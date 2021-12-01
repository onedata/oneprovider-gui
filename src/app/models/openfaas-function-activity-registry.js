/**
 * @module models/openfaas-function-activity-registry
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

/**
 * @typedef {Object} OpenfaasPodActivity
 * @property {string} currentStatus
 * @property {number} lastStatusChangeTimestamp
 * @property {string} eventLogId
 */

/**
 * @typedef {string} OpenfaasPodId
 */

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<Object<OpenfaasPodId,OpenfaasPodActivity>>}
   */
  registry: attr('object'),
}).reopenClass(StaticGraphModelMixin);
