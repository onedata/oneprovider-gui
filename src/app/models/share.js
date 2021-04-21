/**
 * @module models/share
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { computed } from '@ember/object';

export const entityType = 'op_share';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  publicUrl: attr('string'),
  publicRestUrl: attr('string'),
  rootFileType: attr('file-type'),
  description: attr('string'),
  spaceId: attr('string'),

  handle: belongsTo('handle'),
  rootFile: belongsTo('file'),
  privateRootFile: belongsTo('file'),

  hasHandle: computed('handle', function hasHandle() {
    return Boolean(this.belongsTo('handle').id());
  }),
}).reopenClass(StaticGraphModelMixin);
