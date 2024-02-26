/**
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { alias } from '@ember/object/computed';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_user';

export default Model.extend(GraphSingleModelMixin, {
  fullName: attr('string'),
  username: attr('string'),

  effSpaceList: belongsTo('spaceList'),
  effGroupList: belongsTo('groupList'),
  effHandleServiceList: belongsTo('handleServiceList'),
  effAtmInventoryList: belongsTo('atmInventoryList'),

  name: alias('fullName'),
}).reopenClass(StaticGraphModelMixin);
