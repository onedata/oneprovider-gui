/**
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import _ from 'lodash';

// model name differs from aspect name to avoid "s" on end of model name
export const aspect = 'archive_recall_details';

export default Model.extend(GraphSingleModelMixin, {
  providerManager: service(),

  archive: belongsTo('archive'),
  dataset: belongsTo('dataset'),
  recallingProvider: belongsTo('provider'),
  totalFileCount: attr('number'),
  totalByteSize: attr('number'),
  startTime: attr('number'),
  finishTime: attr('number'),
  cancelTime: attr('number'),

  /**
   * @type {ArchiveRecallLastError}
   */
  lastError: attr('object', { defaultValue: null }),

  errorOccurred: computedPipe('lastError', (value) => !_.isEmpty(value)),

  isOnLocalProvider: computed(function isOnLocalProvider() {
    const currentProviderId = this.get('providerManager').getCurrentProviderId();
    const recallingProviderId = this.relationEntityId('recallingProvider');
    return recallingProviderId === currentProviderId;
  }),
}).reopenClass(StaticGraphModelMixin);
