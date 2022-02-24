/**
 * Information and actions for file in recalling or recalled archive.
 *
 * @module components/file-recall
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import { promise, raw, array, equal } from 'ember-awesome-macros';
import { all as allFulfilled, hashSettled } from 'rsvp';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import recallingPercentageProgress from 'oneprovider-gui/utils/recalling-percentage-progress';
import _ from 'lodash';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import resolveFilePath, { stringifyFilePath, dirSeparator } from 'oneprovider-gui/utils/resolve-file-path';
import cutDirsPath from 'oneprovider-gui/utils/cut-dirs-path';

/**
 * @typedef  {'message'|'raw'|'unknown'} RecallInfoErrorType
 */

/**
 * @typedef {'scheduled'|'pending'|'cancelling'|'stopped'|'succeeded'|'failed'} FileRecallProcessStatus
 */

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  fileManager: service(),
  archiveManager: service(),
  datasetManager: service(),
  archiveRecallStateManager: service(),
  appProxy: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall',

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

  /**
   * @type {boolean}
   */
  cancelRecallOpened: false,

  //#endregion

  initialRequiredDataProxy: promise.object(computed(
    async function initialRequiredDataProxy() {
      const {
        archiveProxy,
        datasetProxy,
        recallRootFileProxy,
        archiveRecallInfoProxy,
        archiveRecallStateProxy,
        relativePathProxy,
      } = this.getProperties(
        'archiveProxy',
        'datasetProxy',
        'recallRootFileProxy',
        'archiveRecallInfoProxy',
        'archiveRecallStateProxy',
        'relativePathProxy',
      );
      const result = await hashSettled({
        archive: archiveProxy,
        dataset: datasetProxy,
        root: recallRootFileProxy,
        info: archiveRecallInfoProxy,
        state: archiveRecallStateProxy,
        relativePath: relativePathProxy,
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
      const datasetId = get(dataset, 'entityId');

      if (!archiveId) {
        return null;
      }

      return appProxy.callParent('getDatasetsUrl', {
        selectedArchives: [archiveId],
        selectedDatasets: datasetId ? [datasetId] : null,
      });
    }
  )),

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

  relativePathProxy: promise.object(computed(
    'file',
    'recallRootFile',
    async function relativePathProxy() {
      const {
        file,
        recallRootFile,
      } = this.getProperties('file', 'recallRootFile');
      const path = await resolveFilePath(file);
      const stringifiedRelativePath = stringifyFilePath(
        cutDirsPath(path, recallRootFile).slice(1),
        'name',
        dirSeparator,
        false
      );
      return `.${dirSeparator}${stringifiedRelativePath}`;
    }
  )),

  archiveRecallInfo: computedLastProxyContent('archiveRecallInfoProxy'),

  archiveRecallState: computedLastProxyContent('archiveRecallStateProxy'),

  archive: computedLastProxyContent('archiveProxy'),

  dataset: computedLastProxyContent('datasetProxy'),

  recallRootFile: computedLastProxyContent('recallRootFileProxy'),

  archiveUrl: computedLastProxyContent('archiveUrlProxy'),

  datasetUrl: computedLastProxyContent('datasetUrlProxy'),

  relativePath: computedLastProxyContent('relativePathProxy'),

  recallingPercent: computed(
    'file.{recallingMembership,archiveRecallState.content.bytesCopied,archiveRecallInfo.content.totalByteSize}',
    function recallingPercent() {
      const file = this.get('file');
      return recallingPercentageProgress(file);
    }
  ),

  startTime: reads('archiveRecallInfo.startTime'),

  finishTime: reads('archiveRecallInfo.finishTime'),

  cancelTime: reads('archiveRecallInfo.cancelTime'),

  filesFailed: reads('archiveRecallState.filesFailed'),

  lastError: computed('archiveRecallState.lastError', function lastError() {
    const lastErrorData = this.get('archiveRecallState.lastError');
    return _.isEmpty(lastErrorData) ? null : lastErrorData;
  }),

  /**
   * @type {ComputedProperty<FileRecallProcessStatus>}
   */
  processStatus: computed(
    'startTime',
    'finishTime',
    'cancelTime',
    'filesFailed',
    'lastError',
    function processStatus() {
      const {
        startTime,
        finishTime,
        cancelTime,
        filesFailed,
        lastError,
      } = this.getProperties(
        'startTime',
        'finishTime',
        'cancelTime',
        'filesFailed',
        'lastError',
      );
      if (!startTime) {
        return 'scheduled';
      }
      if (finishTime) {
        if (filesFailed || lastError) {
          return 'failed';
        } else if (cancelTime) {
          return 'cancelled';
        } else {
          return 'succeeded';
        }
      } else if (cancelTime) {
        return 'cancelling';
      } else {
        return 'pending';
      }
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  showFooter: array.includes(
    raw(['scheduled', 'pending', 'cancelling']),
    'processStatus'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isCancelling: equal('processStatus', raw('cancelling')),

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
    cancelRecallClicked() {
      if (this.get('isCancelling')) {
        return;
      }
      this.set('cancelRecallOpened', true);
    },
    closeCancelRecallModal() {
      this.set('cancelRecallOpened', false);
    },
  },
});
