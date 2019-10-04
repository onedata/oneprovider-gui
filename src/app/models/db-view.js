/**
 * Database view with which a set of files can be transferred
 * 
 * @module models/file
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';

import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  space: belongsTo('space'),
  // FIXME: a list of ids of providers that needs authHint: throughSpace, space
  providers: attr('array'),
  spatial: attr('boolean'),
  viewOptions: attr('object'),
  mapFunction: attr('string'),
  reduceFunction: attr('string'),

  init() {
    // FIXME: convert providers array to promise array; !warn: no reactiveness
    this._super(...arguments);
  },
}).reopenClass(StaticGraphModelMixin);
