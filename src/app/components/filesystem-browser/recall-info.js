/**
 * Information about file in recalling or recalled archive - basic info and live
 * statistics.
 *
 * @module components/recall-info
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import { promise, equal, raw } from 'ember-awesome-macros';
import { all as allFulfilled, hashSettled } from 'rsvp';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import recallingPercentageProgress from 'oneprovider-gui/utils/recalling-percentage-progress';
import _ from 'lodash';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['recall-info'],

  i18n: service(),
  fileManager: service(),
  archiveManager: service(),
  datasetManager: service(),
  archiveRecallStateManager: service(),
  parentAppNavigation: service(),
  appProxy: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.recallInfo',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * If recall info is in closeable container, it should be closed on this callback.
   * @virtual optional
   * @type {() => void}
   */
  onClose: notImplementedIgnore,

  //#region state

  /**
   * @type {String}
   */
  archiveRecallStateToken: null,

  //#endregion

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  initialRequiredDataProxy: promise.object(computed(
    async function initialRequiredDataProxy() {
      const {
        archiveProxy,
        datasetProxy,
        recallRootFileProxy,
        archiveRecallInfoProxy,
        archiveRecallStateProxy,
      } = this.getProperties(
        'archiveProxy',
        'datasetProxy',
        'recallRootFileProxy',
        'archiveRecallInfoProxy',
        'archiveRecallStateProxy',
      );
      const result = await hashSettled({
        archive: archiveProxy,
        dataset: datasetProxy,
        root: recallRootFileProxy,
        info: archiveRecallInfoProxy,
        state: archiveRecallStateProxy,
      });
      if (result.root.state === 'rejected' || result.info.state === 'rejected') {
        throw result.root.reason || result.info.reason;
      }
    }
  )),

  archiveRecallInfoProxy: reads('file.archiveRecallInfo'),

  archiveRecallStateProxy: reads('file.archiveRecallState'),

  archiveProxy: promise.object(computed(
    'archiveRecallInfoProxy',
    async function archiveProxy() {
      const {
        archiveRecallInfoProxy,
        archiveManager,
      } = this.getProperties(
        'archiveRecallInfoProxy',
        'archiveManager',
      );
      const archive = await (await archiveRecallInfoProxy).getRelation('archive');
      return archiveManager.getBrowsableArchive(archive);
    }
  )),

  datasetProxy: promise.object(computed(
    'archiveRecallInfoProxy',
    async function datasetProxy() {
      const {
        archiveRecallInfoProxy,
        datasetManager,
      } = this.getProperties(
        'archiveRecallInfoProxy',
        'datasetManager',
      );
      const dataset = await (await archiveRecallInfoProxy).getRelation('dataset');
      return datasetManager.getBrowsableDataset(dataset);
    }
  )),

  recallRootFileProxy: promise.object(computed(
    'file.recallRootId',
    function recallRootFileProxy() {
      const {
        file,
        fileManager,
      } = this.getProperties(
        'fileManager',
        'file',
      );
      return fileManager.getFileById(get(file, 'recallRootId'));
    }
  )),

  archiveId: computed('archiveRecallInfo.archive', function archiveId() {
    const archiveRecallInfo = this.get('archiveRecallInfo');
    return archiveRecallInfo && archiveRecallInfo.relationEntityId('archive');
  }),

  datasetId: computed('archiveRecallInfo.dataset', function datasetId() {
    const archiveRecallInfo = this.get('archiveRecallInfo');
    return archiveRecallInfo && archiveRecallInfo.relationEntityId('dataset');
  }),

  recallRootFile: reads('recallRootFileProxy.content'),

  archiveRecallInfo: computedLastProxyContent('archiveRecallInfoProxy'),

  archiveRecallState: computedLastProxyContent('archiveRecallStateProxy'),

  archive: computedLastProxyContent('archiveProxy'),

  dataset: computedLastProxyContent('datasetProxy'),

  archiveName: reads('archive.name'),

  datasetName: reads('dataset.name'),

  filesRecalled: reads('archiveRecallState.filesCopied'),

  filesToRecall: reads('archiveRecallInfo.totalFileCount'),

  filesFailed: reads('archiveRecallState.filesFailed'),

  lastError: computed('archiveRecallState.lastError', function lastError() {
    const lastErrorData = this.get('archiveRecallState.lastError');
    return _.isEmpty(lastErrorData) ? null : lastErrorData;
  }),

  bytesRecalled: reads('archiveRecallState.bytesCopied'),

  bytesToRecall: reads('archiveRecallInfo.totalByteSize'),

  bytesRecalledText: computedPipe('bytesRecalled', bytesToString),

  bytesToRecallText: computedPipe('bytesToRecall', bytesToString),

  startedAt: computedPipe(
    'archiveRecallInfo.startTime',
    (millis) => millis && Math.floor(millis / 1000)
  ),

  finishedAt: computedPipe(
    'archiveRecallInfo.finishTime',
    (millis) => millis && Math.floor(millis / 1000)
  ),

  recallingPercent: computed(
    'file.{recallingMembership,archiveRecallState.content.bytesCopied,archiveRecallInfo.content.totalByteSize}',
    function recallingPercent() {
      const file = this.get('file');
      return recallingPercentageProgress(file);
    }
  ),

  /**
   * @type {'scheduled'|'pending'|'succeeded'|'failed'}
   */
  processStatus: computed(
    'startedAt',
    'finishedAt',
    'filesFailed',
    'lastError',
    function processStatus() {
      const {
        startedAt,
        finishedAt,
        filesFailed,
        lastError,
      } = this.getProperties(
        'startedAt',
        'finishedAt',
        'filesFailed',
        'lastError',
      );
      if (!startedAt) {
        return 'scheduled';
      }
      if (finishedAt) {
        if (filesFailed || lastError) {
          return 'failed';
        } else {
          return 'succeeded';
        }
      } else {
        return 'pending';
      }
    }
  ),

  archiveUrlProxy: promise.object(computed(
    'archiveProxy',
    'datasetProxy',
    async function archiveUrlProxy() {
      const {
        archiveProxy,
        datasetProxy,
        appProxy,
      } = this.getProperties('archiveProxy', 'datasetProxy', 'appProxy');

      const [archive, dataset] = await allFulfilled([archiveProxy, datasetProxy]);
      const archiveId = get(archive, 'entityId');
      const datasetId = get(dataset, 'entityId') || null;

      if (!archiveId) {
        return null;
      }

      return appProxy.callParent('getDatasetsUrl', {
        selectedArchives: [archiveId],
        selectedDatasets: datasetId ? [datasetId] : null,
      });
    }
  )),

  archiveUrl: reads('archiveUrlProxy.content'),

  datasetUrlProxy: promise.object(computed(
    'datasetProxy',
    async function datasetUrlProxy() {
      const {
        datasetProxy,
        appProxy,
      } = this.getProperties('datasetProxy', 'appProxy');

      const dataset = await datasetProxy;
      const datasetId = get(dataset, 'entityId');

      if (!datasetId) {
        return null;
      }

      return appProxy.callParent('getDatasetsUrl', {
        selectedDatasets: [datasetId],
      });
    }
  )),

  datasetUrl: reads('datasetUrlProxy.content'),

  /**
   * @typedef  {'message'|'raw'|'unknown'} RecallInfoErrorType
   */

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

  showErrorTextarea: equal('lastErrorParsed.type', raw('raw')),

  init() {
    this._super(...arguments);
    const {
      archiveRecallStateManager,
      file,
    } = this.getProperties(
      'archiveRecallStateManager',
      'file',
    );
    const token = archiveRecallStateManager.watchRecall(file);
    this.set('archiveRecallStateToken', token);
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      const {
        archiveRecallStateManager,
        file,
        archiveRecallStateToken,
      } = this.getProperties(
        'archiveRecallStateManager',
        'file',
        'archiveRecallStateToken',
      );
      archiveRecallStateManager.unwatchRecall(file, archiveRecallStateToken);
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    targetFileLinkClicked(event) {
      if (!isNewTabRequestEvent(event)) {
        this.get('onClose')();
      }
    },
  },
});
