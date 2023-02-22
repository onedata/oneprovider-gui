/**
 * Configuration of archive form for creating new archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get, setProperties, computed } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { inject as service } from '@ember/service';
import ArchiveFormBaseModel from 'oneprovider-gui/utils/archive-form/-base-model';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';

export default ArchiveFormBaseModel.extend(I18n, {
  archiveManager: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.archiveForm.createModel',

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
        // Incremental toggle is disabled on start, because 1) if base archive is
        // provided, it should be always disabled and 2) otherwise it should be only
        // unlocked when the last valid archive is found (see invocations of
        // `enableIncrementalField`),
        isEnabled: false,
      });
  }),

  /**
   * @override
   */
  baseArchiveTextProxy: promise.object(computed(
    'baseArchiveProxy',
    async function baseArchiveTextProxy() {
      const baseArchive = await this.get('baseArchiveProxy');
      return baseArchive && get(baseArchive, 'name') || '–';
    }
  )),

  init() {
    this._super(...arguments);
    // Base archive is updated always on init, because we want to resolve state
    // of configIncrementalField.
    this.updateBaseArchiveProxy();
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
      }
    }
  },

  async fetchLatestArchive() {
    const datasetId = get(this.dataset, 'entityId');
    let archiveRecord = null;
    let isEndReached = false;
    let currentIndex = null;
    // searching using non-single chunks because there could be some failed archives
    const chunkSize = 5;
    while (!archiveRecord && !isEndReached) {
      const archivesData = await this.archiveManager.fetchDatasetArchives({
        datasetId,
        limit: chunkSize,
        offset: 0,
        index: currentIndex,
      });
      const archives = archivesData.childrenRecords;
      archiveRecord = archives.find(archive =>
        get(archive, 'metaState') === 'succeeded'
      );
      if (archiveRecord) {
        this.enableIncrementalField();
        return this.archiveManager.getBrowsableArchive(archiveRecord);
      } else {
        const lastArchive = _.last(archives);
        if (!lastArchive || archivesData.isLast) {
          isEndReached = true;
        } else {
          currentIndex = get(lastArchive, 'index');
        }
      }
    }
    if (!archiveRecord) {
      this.setNoArchivesToIncrement();
    }
  },

  enableIncrementalField() {
    setProperties(this.configIncrementalField, {
      isEnabled: true,
      disabledControlTip: null,
    });
  },

  setNoArchivesToIncrement() {
    setProperties(this.configIncrementalField, {
      isEnabled: false,
      disabledControlTip: this.t('noValidToIncrement'),
    });
    this.configIncrementalField.valueChanged(false);
  },
});
