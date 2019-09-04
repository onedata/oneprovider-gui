/**
 * @module models/acl
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * @typedef {Object} Ace
 * @property {string} aceType 'ALLOW' | 'DENY'
 * @property {string} identifier subject id or 'OWNER@' | 'GROUP@' | 'EVERYONE@'
 * @property {number} aceFlags union of ACE related flags. Available flags:
 *   - IDENTIFIER_GROUP == 0x00000040 - passed `identifier` is related
 *     to group, not user. Flags definition is in utils/acl-permissions-specification.
 * @property {number} aceMask union of ACE permissions. Available flags are
 *   described in utils/acl-permissions-specification
 * @property {Models.User|Models.Group} subject
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {Array<Ace>}
   */
  list: attr('array'),
}).reopenClass(StaticGraphModelMixin);
