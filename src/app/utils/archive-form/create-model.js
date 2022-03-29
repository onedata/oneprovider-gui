import { get, computed } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { inject as service } from '@ember/service';
import ArchiveFormBaseModel from 'oneprovider-gui/utils/archive-form/-base-model';

export default ArchiveFormBaseModel.extend({
  archiveManager: service(),

  /**
   * @virtual
   */
  dataset: undefined,

  /**
   * Injected options for archive creation.
   * @virtual optional
   * @type {CreateArchiveOptions}
   */
  options: undefined,

  /**
   * Set by `updateBaseArchiveProxy`.
   * @type {PromiseObject<Utils.BrowsableArchive>}
   */
  baseArchiveProxy: null,

  configIncrementalField: computed('options', function configIncrementalField() {
    const options = this.get('options');
    const baseArchive = options && options.baseArchive;
    const isBaseArchiveProvided = Boolean(baseArchive);
    const configIncrementalFieldClass = this.get('configIncrementalFieldClass');
    return configIncrementalFieldClass
      .extend({
        onValueChange() {
          this._super(...arguments);
          const value = this.get('value');
          if (value) {
            this.get('formModel').updateBaseArchiveProxy();
          }
        },
      })
      .create({
        formModel: this,
        defaultValue: isBaseArchiveProvided,
        isEnabled: !isBaseArchiveProvided,
      });
  }),

  init() {
    this._super(...arguments);
    if (this.get('options.baseArchive')) {
      this.updateBaseArchiveProxy();
    }
  },

  async updateBaseArchiveProxy() {
    this.set('baseArchiveProxy', promiseObject(this.getBaseArchive()));
  },

  async getBaseArchive() {
    const injectedBaseArchive = this.get('options.baseArchive');
    if (injectedBaseArchive) {
      return injectedBaseArchive;
    } else {
      try {
        return await this.fetchLatestArchive();
      } catch (error) {
        // always resolve this promise, but pass error to form
        console.debug(
          `getBaseArchive: error getting baseArchive: ${error}`
        );
        return {
          isCustomOnedataError: true,
          type: 'cannot-fetch-latest-archive',
          reason: error,
        };
      }
    }
  },

  async fetchLatestArchive() {
    const {
      archiveManager,
      dataset,
    } = this.getProperties('archiveManager', 'dataset');
    const archivesData = await archiveManager.fetchDatasetArchives({
      datasetId: get(dataset, 'entityId'),
      limit: 1,
      offset: 0,
    });
    const archiveRecord = get(archivesData, 'childrenRecords.0');
    if (archiveRecord) {
      return archiveManager.getBrowsableArchive(archiveRecord);
    } else {
      if (!archivesData.isLast) {
        throw new Error(
          'fetchLatestArchive: invalid archive listing data'
        );
      }
      // there is no latest archive, because there are no archives
      return null;
    }
  },
});
