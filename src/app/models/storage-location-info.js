/**
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

/**
 * An object where keys are provider id.
 * Values are object where keys are storage id
 * and values are file location on that storage.
 * @typedef {Object<string, Object<string, string>} LocationsPerProvider
 */

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<LocationsPerProvider>}
   */
  locationsPerProvider: attr('object'),
}).reopenClass(StaticGraphModelMixin);
