/**
 * @module models/dataset
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { equal, raw } from 'ember-awesome-macros';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';
import Mixin from '@ember/object/mixin';

export const entityType = 'op_dataset';

export const RuntimeProperties = Mixin.create({
  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAttached: equal('state', raw('attached')),

  dataIsProtected: hasProtectionFlag('protectionFlags', 'data'),
  metadataIsProtected: hasProtectionFlag('protectionFlags', 'metadata'),
});

export default Model.extend(GraphSingleModelMixin, RuntimeProperties, {
  index: attr('string'),

  parent: belongsTo('dataset'),

  /**
   * Possible values: 'attached', 'detached'
   */
  state: attr('string'),

  /**
   * Id of file or directory being dataset root
   */
  rootFile: belongsTo('file'),

  /**
   * Possible values: 'metadata_protection', 'data_protection'
   */
  protectionFlags: attr('array'),

  /**
   * Creation time in UNIX timestamp format.
   */
  creationTime: attr('number'),

  rootFilePath: attr('string'),
  rootFileType: attr('file-type'),
}).reopenClass(StaticGraphModelMixin);
