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
    const rootFilePath = this.get('rootFilePath');
    if (rootFilePath) {
      try {
        const pathArray = rootFilePath.split('/');
        return pathArray[pathArray.length - 1] || '';
      } catch (error) {
        console.error(`model:dataset#name: cannot get name from path: ${error}`);
        return '';
      }
    } else {
      return '';
    }
  }),

  hasParent: computed(function hasParent() {
    return Boolean(this.belongsTo('parent').id());
  }),
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
   * **NOTE:** value of this property may differ from `effProtectionFlags` of file
   * and fileDatasetSummary!
   * 
   * Effective protection flags - concerning attached ancestor dataset flags.
   * Applicable only for datasets in attached state - detached datasets will have
   * this property always as empty array (`[]`).
   * This property differs for effective flags for file and file dataset summary
   * because files' version concerns protection flags on hardlinks datasets.
   * 
   * Possible values: 'metadata_protection', 'data_protection'
   */
  effProtectionFlags: attr('array'),

  /**
   * Creation time in UNIX timestamp format.
   */
  creationTime: attr('number'),

  rootFilePath: attr('string'),
  rootFileType: attr('file-type'),
}).reopenClass(StaticGraphModelMixin);
