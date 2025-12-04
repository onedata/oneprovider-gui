/**
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @copyright (C) 2025 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { reads } from '@ember/object/computed';

export const entityType = 'op_provider';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  latitude: attr('number'),
  longitude: attr('number'),
  online: attr('boolean'),
  domain: attr('string'),
  version: attr('string'),

  /**
   * Release version, which is currently stored in `version` attribute.
   * For compatibility with Onezone Provider model.
   */
  releaseVersion: reads('string'),
}).reopenClass(StaticGraphModelMixin);
