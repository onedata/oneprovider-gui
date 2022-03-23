/**
 * Shows information about file in recalling or recalled archive - basic info and live
 * statistics (all data provided by parent component).
 *
 * @module components/file-recall/info-table
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { equal, raw, and, not, array, or, conditional } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  tagName: 'table',
  classNames: [
    'file-recall-info-table',
    'table',
    'table-info',
    'table-info-collapsible',
  ],

  parentAppNavigation: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall.infoTable',

  /**
   * @virtual
   * @type {FileRecallProcessStatus}
   */
  processStatus: undefined,

  /**
   * @virtual
   * @type {Object}
   */
  lastError: undefined,

  /**
   * @virtual
   * @type {Models.ArchiveRecallInfo}
   */
  archiveRecallInfo: undefined,

  /**
   * If not provided, progress info like number of recalled files will be unavailable.
   * @virtual optional
   * @type {Models.ArchiveRecallState}
   */
  archiveRecallState: undefined,

  /**
   * @virtual optional
   * @type {() => void}
   */
  onClose: notImplementedIgnore,

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  stateNotAvailable: not('archiveRecallState'),

  processStatusTextClass: or(
    conditional(
      equal('processStatus', raw('failed')),
      raw('text-danger')
    ),
    conditional(
      array.includes(raw(['cancelling', 'cancelled']), 'processStatus'),
      raw('text-warning')
    ),
    raw(''),
  ),

  archiveName: reads('archive.name'),

  datasetName: reads('dataset.name'),

  archiveId: computed('archiveRecallInfo.archive', function archiveId() {
    const archiveRecallInfo = this.get('archiveRecallInfo');
    return archiveRecallInfo && archiveRecallInfo.relationEntityId('archive');
  }),

  datasetId: computed('archiveRecallInfo.dataset', function datasetId() {
    const archiveRecallInfo = this.get('archiveRecallInfo');
    return archiveRecallInfo && archiveRecallInfo.relationEntityId('dataset');
  }),

  fileIsRecallRoot: equal('file', 'recallRootFile'),

  renderRelativePathInput: and('relativePath', not('fileIsRecallRoot')),

  showErrorTextarea: equal('lastErrorParsed.type', raw('raw')),

  bytesRecalled: reads('archiveRecallState.bytesCopied'),

  bytesToRecall: reads('archiveRecallInfo.totalByteSize'),

  bytesRecalledText: computedPipe('bytesRecalled', bytesToString),

  bytesToRecallText: computedPipe('bytesToRecall', bytesToString),

  startedAt: computedPipe(
    'archiveRecallInfo.startTime',
    (millis) => millis && Math.floor(millis / 1000)
  ),

  cancelledAt: computedPipe(
    'archiveRecallInfo.cancelTime',
    (millis) => millis && Math.floor(millis / 1000)
  ),

  finishedAt: computedPipe(
    'archiveRecallInfo.finishTime',
    (millis) => millis && Math.floor(millis / 1000)
  ),

  /**
   * @returns {{ type: RecallInfoErrorType, message: String }}
   */
  lastErrorParsed: computed('lastError', function lastErrorString() {
    const {
      lastError,
      errorExtractor,
    } = this.getProperties('lastError', 'errorExtractor');
    if (lastError) {
      const messageObject = errorExtractor.getMessage(lastError && lastError.reason);
      if (messageObject && messageObject.message) {
        return { type: 'message', message: messageObject.message };
      } else {
        return { type: 'raw', message: JSON.stringify(lastError, null, 2) };
      }
    }
    return { type: 'unknown' };
  }),

  filesRecalled: reads('archiveRecallState.filesCopied'),

  filesToRecall: reads('archiveRecallInfo.totalFileCount'),

  filesFailed: reads('archiveRecallState.filesFailed'),

  actions: {
    targetFileLinkClicked(event) {
      const onClose = this.get('onClose');
      if (!isNewTabRequestEvent(event) && onClose) {
        onClose();
      }
    },
  },
});
