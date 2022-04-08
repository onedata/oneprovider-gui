/**
 * @module models/archive-recall-state
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { or } from 'ember-awesome-macros';
import { get } from '@ember/object';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import _ from 'lodash';

// model name differs from aspect name to avoid "s" on end of model name
export const aspect = 'archive_recall_progress';

/**
 * @typedef {Object} ArchiveRecallLastError
 * @property {string} fileId
 * @property {Object} reason
 */

export default Model.extend(GraphSingleModelMixin, {
  bytesCopied: attr('number'),
  filesCopied: attr('number'),
  filesFailed: attr('number'),

  /**
   * @type {ArchiveRecallLastError}
   */
  lastError: attr('object', { defaultValue: null }),

  errorOccurred: or(
    'filesFailed',
    computedPipe('lastError', (value) => !_.isEmpty(value))
  ),

  /**
   *
   * @param {Models.ArchiveRecalInfo} archiveRecallInfo info associated with the same
   *   recall process
   * @returns {Boolean}
   */
  isFinished(archiveRecallInfo) {
    if (!archiveRecallInfo) {
      return;
    }
    const {
      filesCopied,
      filesFailed,
    } = this.getProperties('filesCopied', 'filesFailed');
    const totalFileCount = get(archiveRecallInfo, 'totalFileCount');
    return filesCopied + filesFailed >= totalFileCount;
  },
}).reopenClass(StaticGraphModelMixin);
