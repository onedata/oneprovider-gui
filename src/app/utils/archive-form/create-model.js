/**
 * Configuration of archive form for creating new archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get, computed } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { inject as service } from '@ember/service';
import ArchiveFormBaseModel from 'oneprovider-gui/utils/archive-form/-base-model';
import { promise } from 'ember-awesome-macros';

export default ArchiveFormBaseModel.extend({
  archiveManager: service(),

  /**
   * @virtual
   */
  dataset: undefined,

  /**
   * Injected options for archive creation.
   * Note, that changing options in runtime will NOT cause form to recompute.
   * @virtual optional
   * @type {CreateArchiveOptions}
   */
  options: undefined,

  /**
   * Set by `updateBaseArchiveProxy`.
   * @override
   * @type {PromiseObject<Utils.BrowsableArchive>}
   */
  baseArchiveProxy: null,

  /**
   * @override
   * @type {ComputedProperty<FormFieldsRootGroup>}
   */
  rootFieldGroup: computed(function rootFieldGroup() {
    const {
      rootFormGroupClass,
      descriptionField,
      configField,
    } = this.getProperties(
      'rootFormGroupClass',
      'descriptionField',
      'configField',
    );

    return rootFormGroupClass
      .create({
        fields: [
          descriptionField,
          configField,
        ],
      });
  }),

  /**
   * @override
   */
  configIncrementalField: computed(function configIncrementalField() {
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
        defaultValue: isBaseArchiveProvided,
        isEnabled: !isBaseArchiveProvided,
      });
  }),

  /**
   * @override
   */
  baseArchiveTextProxy: promise.object(computed(
    'baseArchiveProxy',
    async function baseArchiveTextProxy() {
      try {
        const baseArchive = await this.get('baseArchiveProxy');
        return baseArchive && get(baseArchive, 'name') || '–';
      } catch (error) {
        if (
          error &&
          error.isCustomOnedataError &&
          error.type === 'cannot-fetch-latest-archive'
        ) {
          return this.t('latestArchive');
        } else {
          throw error;
        }
      }
    }
  )),

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
        console.debug(
          `getBaseArchive: error getting baseArchive: ${error}`
        );
        throw {
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
