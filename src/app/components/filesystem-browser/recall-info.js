import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import { promise } from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import recallingPercentageProgress from 'oneprovider-gui/utils/recalling-percentage-progress';

export default Component.extend(I18n, {
  classNames: ['recall-info'],

  i18n: service(),
  archiveManager: service(),
  datasetManager: service(),
  archiveRecallStateManager: service(),
  parentAppNavigation: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.recallInfo',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

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
    function initialRequiredDataProxy() {
      const {
        archive,
        dataset,
        archiveRecallInfoProxy,
        archiveRecallStateProxy,
      } = this.getProperties(
        'archive',
        'dataset',
        'archiveRecallInfoProxy',
        'archiveRecallStateProxy',
      );
      // FIXME: support for failures
      return allFulfilled([
        archive,
        dataset,
        archiveRecallInfoProxy,
        archiveRecallStateProxy,
      ]);
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
      const archive = get(
        await archiveRecallInfoProxy,
        'sourceArchive'
      );
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
      const archive = get(
        await archiveRecallInfoProxy,
        'sourceDataset'
      );
      return datasetManager.getBrowsableDataset(archive);
    }
  )),

  archiveRecallInfo: computedLastProxyContent('archiveRecallInfoProxy'),

  archiveRecallState: computedLastProxyContent('archiveRecallStateProxy'),

  archive: computedLastProxyContent('archiveProxy'),

  dataset: computedLastProxyContent('datasetProxy'),

  archiveName: reads('archive.name'),

  datasetName: reads('dataset.name'),

  filesRecalled: reads('archiveRecallState.currentFiles'),

  filesToRecall: reads('archiveRecallInfo.targetFiles'),

  filesFailed: reads('archiveRecallState.filesFailed'),

  lastError: reads('archiveRecallState.lastError'),

  bytesRecalled: reads('archiveRecallState.currentBytes'),

  bytesToRecall: reads('archiveRecallInfo.targetBytes'),

  bytesRecalledText: computedPipe('bytesRecalled', bytesToString),

  bytesToRecallText: computedPipe('bytesToRecall', bytesToString),

  startedAt: reads('archiveRecallInfo.startTimestamp'),

  finishedAt: reads('archiveRecallInfo.finishTimestamp'),

  recallingPercent: computed(
    'file.{recallingMembership,archiveRecallState.content.currentBytes,archiveRecallInfo.content.targetBytes}',
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
});
