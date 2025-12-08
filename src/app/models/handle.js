/**
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';

export const entityType = 'op_handle';

/**
 * @typedef {'oai_dc'|'edm'|'oai_datacite'} HandleModel.MetadataType
 */

/**
 * @type {Object<string, HandleModel.MetadataType>}
 */
export const MetadataType = Object.freeze({
  DublinCore: 'oai_dc',
  Edm: 'edm',
  DataCite: 'oai_datacite',
});

export default Model.extend(GraphSingleModelMixin, {
  url: attr('string'),
  metadataString: attr('string'),
  handleService: belongsTo('handle-service'),

  /**
   * @type {MetadataType}
   */
  metadataSchema: attr('string'),
}).reopenClass(StaticGraphModelMixin);
