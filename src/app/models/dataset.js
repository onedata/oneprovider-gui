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
import { computed } from '@ember/object';
import { getDatasetNameFromRootFilePath } from 'onedata-gui-common/utils/dataset';

export const entityType = 'op_dataset';

export const RuntimeProperties = Mixin.create({
  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAttached: equal('state', raw('attached')),

  dataIsProtected: hasProtectionFlag('protectionFlags', 'data'),
  metadataIsProtected: hasProtectionFlag('protectionFlags', 'metadata'),

  dataIsEffProtected: hasProtectionFlag('effProtectionFlags', 'data'),
  metadataIsEffProtected: hasProtectionFlag('effProtectionFlags', 'metadata'),

  name: computed('rootFilePath', function name() {
    return getDatasetNameFromRootFilePath(this.get('rootFilePath')) ?? '';
  }),

  hasParent: computed('parent', function hasParent() {
    return Boolean(this.belongsTo('parent').id());
  }),
});

export default Model.extend(GraphSingleModelMixin, RuntimeProperties, {
  index: attr('string'),

  spaceId: attr('string'),

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
   * @type {ComputedProperty<Array<ProtectionFlag>>}
   */
  protectionFlags: attr('array'),

  /**
   * **NOTE:** value of this property may differ from `effProtectionFlags` of file
   * and fileDatasetSummary!
   *
   * Effective protection flags - concerning attached ancestor dataset flags.
   * Applicable only for datasets in attached state - detached datasets will have
   * this property always as empty array (`[]`).
   * This property differs for effective flags for file and file dataset summary
   * because files' version concerns protection flags on hardlinks datasets.
   *
   * @type {ComputedProperty<Array<ProtectionFlag>>}
   */
  effProtectionFlags: attr('array'),

  /**
   * Creation time in UNIX timestamp format.
   */
  creationTime: attr('number'),

  archiveCount: attr('number'),

  rootFilePath: attr('string'),
  rootFileType: attr('file-type'),
  rootFileDeleted: attr('boolean', { defaultValue: false }),
}).reopenClass(StaticGraphModelMixin);
