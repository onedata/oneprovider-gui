import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import { promise } from 'ember-awesome-macros';
import { allSettled } from 'rsvp';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';

export default Component.extend(I18n, {
  classNames: ['recall-info'],

  i18n: service(),
  archiveManager: service(),
  datasetManager: service(),
  archiveRecallStateManager: service(),

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

  initialRequiredDataProxy: promise.object(computed(
    function initialRequiredDataProxy() {
      return allSettled([
        this.get('archiveRecallInfoProxy'),
        this.get('archiveRecallStateProxy'),
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

  bytesRecalled: reads('archiveRecallState.currentBytes'),

  bytesToRecall: reads('archiveRecallInfo.targetBytes'),

  bytesRecalledText: computedPipe('bytesRecalled', bytesToString),

  bytesToRecallText: computedPipe('bytesToRecall', bytesToString),

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
