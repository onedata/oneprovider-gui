/**
 * @module models/file-distribution
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

/**
 * @typedef {Object} StorageDistribution Contains info about distribution of
 *   some file on specified Storage
 * @property {number} physicalSize Physical size of the file on this storage.
 * @property {Object} chunksBarData Present when file type is reg file.
 * @property {number} blocksPercentage Possible values: 0 - 100.
 * Present when file type is reg file.
 * @property {number} blockCount Present when file type is reg file.
 *
 * `chunksBarData` is used for drawing file distribution bar chart. The
 * format is an object, where keys are start pixel of bar (0-319)
 * and values are opacity of fill that should be used to fill the fragment
 * from start pixel to next start pixel. Eg. `{ 0: 0, 160: 50, 300: 25 }` will draw:
 * - first half of the bar will be empty
 * - from the half of the bar, the bar will have 50% opacity
 * - on the end (300-319 pixels) the bar will have 25% opacity
 */

/**
 * @typedef {Object} OneproviderDistribution Contains info about distribution of
 *   some file on specified Oneprovider
 * @property {number} logicalSize Logical size of file/dir as seen by this provider.
 * @property {boolean} success Indicates whether fetching file distribution for this
 *   provider was successful.
 * @property {Object} distributionPerStorage Maps storageId -> StorageDistribution
 * When success == true contains map storageId -> StorageDistribution.
 * When success == false contains map storageId -> error
 */

export default Model.extend(GraphSingleModelMixin, {
  /**
   * Contains mapping oneproviderId -> OneproviderDistribution of file on specified
   * Oneprovider. If some Oneprovider is not mentioned in above mapping, then it
   * means that it never synchronized this file.
   */
  distributionPerProvider: attr('object'),
}).reopenClass(StaticGraphModelMixin);
