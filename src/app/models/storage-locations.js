/**
 * @module models/storage-locations
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

/**
 * An object where keys are storage id. Values are file location on that storage.
 * @typedef {Object} LocationsPerStorage
 */

export default Model.extend(GraphSingleModelMixin, {
  locationsPerStorage: attr('object'),
}).reopenClass(StaticGraphModelMixin);
