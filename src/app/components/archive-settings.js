/**
 * Component for managing properties of archive or create archives.
 * Needs modal-like for layout rendering.
 *
 * @module components/archive-settings
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export default Component.extend(I18n, {
  // do not use tag, because the layout is built by `modal` property
  // for styling, use: `archive-settings-part` class
  tagName: '',

  i18n: service(),
  globalNotify: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings',

  /**
   * @virtual
   * @type {Function}
   */
  onClose: notImplementedIgnore,

  /**
   * Should be invoked with object suitable for `datasetManager#createArchive` data
   * @virtual
   * @type {(archiveCreateData: Object) => any}
   */
  onSubmit: notImplementedWarn,

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * Instance of modal-like component to render layout (header, body, footer)
   * @virtual
   * @type {Component}
   */
  modal: undefined,

  /**
   * Injected options for archive creation.
   * @virtual optional
   * @type {CreateArchiveOptions}
   */
  options: undefined,

  /**
   * True if submit Promise is pending.
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * Data dumped from form root
   * @type {EmberObject}
   */
  formData: Object.freeze({}),

  /**
   * Stores validation state of form
   * @type {Boolean}
   */
  isValid: undefined,

  /**
   * True, if submit is available for component state and current form data
   * @type {ComputedProperty<Boolean>}
   */
  canSubmit: reads('isValid'),

  /**
   * Initialized/set by `updateBaseArchiveProxy` method.
   * @type {PromiseObject<Utils.BrowsableArchive>}
   */
  baseArchiveProxy: null,

  init() {
    this._super(...arguments);
    if (this.get('options.baseArchive')) {
      this.updateBaseArchiveProxy();
    }
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
          `component:archive-settings#getBaseArchive: error getting baseArchive: ${error}`
        );
        return {
          isCustomOnedataError: true,
          type: 'cannot-fetch-latest-archive',
          reason: error,
        };
      }
    }
  },

  async updateBaseArchiveProxy() {
    this.set('baseArchiveProxy', promiseObject(this.getBaseArchive()));
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
          'component:archive-settings#fetchLatestArchive: invalid archive listing data'
        );
      }
      // there is no latest archive, because there are no archives
      return null;
    }
  },

  async submitArchive() {
    const {
      formData,
      canSubmit,
      onSubmit,
    } = this.getProperties('formData', 'canSubmit', 'onSubmit');
    this.set('isSubmitting', true);
    try {
      if (canSubmit) {
        const archiveCreateData = await this.generateArchiveData(formData);
        return await onSubmit(archiveCreateData);
      }
    } finally {
      this.set('isSubmitting', false);
    }
  },

  async generateArchiveData(formData) {
    if (formData) {
      const {
        config,
        description,
        preservedCallback,
        purgedCallback,
      } = getProperties(
        formData,
        'config',
        'description',
        'preservedCallback',
        'purgedCallback'
      );
      // these properties are used in config directly as in form
      const rawConfig = getProperties(
        config,
        'createNestedArchives',
        'layout',
        'includeDip',
      );
      const isIncremental = Boolean(get(config, 'incremental'));
      if (isIncremental) {
        const baseArchive = this.get('baseArchiveProxy.content');
        const baseArchiveId = baseArchive && get(baseArchive, 'entityId');
        const incrementalConfig = {
          enabled: isIncremental,
          basedOn: baseArchiveId,
        };
        rawConfig.incremental = incrementalConfig;
      }

      return {
        config: rawConfig,
        description,
        preservedCallback,
        purgedCallback,
      };
    } else {
      console.warn(
        'component:archive-settings#generateArchiveData: empty form data'
      );
      return {};
    }
  },

  close() {
    this.get('onClose')();
  },

  actions: {
    async submit() {
      try {
        await this.submitArchive();
        this.close();
      } catch (error) {
        this.get('globalNotify').backendError(this.t('creatingArchive'), error);
      }
    },
    formDataUpdate({ formData = {}, isValid = false } = {}) {
      this.setProperties({
        formData,
        isValid,
      });
    },
    close() {
      this.close();
    },
  },
});
