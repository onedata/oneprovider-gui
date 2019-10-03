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

export default Model.extend(GraphSingleModelMixin, {
  /**
   * Contains mapping oneproviderId -> distribution of file on this oneprovider.
   * Each distribution looks like:
   * ```
   * {
   *   chunksBarData: Object,
   *   blocksPercentage: number, // 0 - 100
   *   neverSynchronized: boolean,
   * }
   * ```
   * 
   * `chunksBarData` is used for drawing file distribution bar chart. The
   * format is an object, where keys are start pixel of bar (0-319)
   * and values are opacity of fill that should be used to fill the fragment
   * from start pixel to next start pixel. Eg. `{ 0: 0, 160: 50, 300: 25 }` will draw:
   * - first half of the bar will be empty
   * - from the half of the bar, the bar will have 50% opacity
   * - on the end (300-319 pixels) the bar will have 25% opacity
   */
  distributionPerProvider: attr('object'),
}).reopenClass(StaticGraphModelMixin);
