/**
 * Model and logic for file-distribution components
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, computed } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { Promise, resolve, allSettled } from 'rsvp';
import { raw, array, sum } from 'ember-awesome-macros';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';
import { getOwner } from '@ember/application';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import $ from 'jquery';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';

const mixins = [
  OwnerInjector,
  createDataProxyMixin('oneproviders', { type: 'array' }),
];

export default EmberObject.extend(...mixins, {
  transferManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileDistributionViewModel',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  //#region state

  /**
   * One of: 'distribution-summary', 'distribution-details'.
   * 'distribution-summary' is possible only for multiple files.
   * @type {string}
   */
  activeTab: undefined,

  //#endregion

  /**
   * @type {Ember.ComputedProperty<Array<Utils.FileDistributionDataContainer>>}
   */
  fileDistributionData: computed('files.[]', function fileDistributionData() {
    return this.files.map(file =>
      FileDistributionDataContainer.create(getOwner(this).ownerInjection(), { file })
    );
  }),

  // FIXME: refactor tab names to single word
  init() {
    this._super(...arguments);

    this.set(
      'activeTab',
      this.get('files.length') > 1 ? 'distribution-summary' : 'distribution-details'
    );
  },

  /**
   * @override
   */
  async fetchOneproviders() {
    const providerList = await this.space.getRelation('providerList');
    const list = await get(providerList, 'list');
    await allSettled(list.invoke('reload'));
    return list;
  },

  /**
   * @param {Models.File} file
   * @returns {Promise}
   */
  updateDataAfterTransferStart(file) {
    const fileDistributionData = this.get('fileDistributionData').findBy('file', file);
    if (fileDistributionData) {
      return fileDistributionData.updateData();
    } else {
      return resolve();
    }
  },

  replicate(files, destinationOneprovider) {
    const {
      globalNotify,
      transferManager,
    } = this.getProperties('globalNotify', 'transferManager');
    return Promise.all(files.map(file =>
      transferManager.startReplication(file, destinationOneprovider)
      .then(result => this.updateDataAfterTransferStart(file).then(() => result))
    )).catch(error => {
      globalNotify.backendError(this.t('startingReplication'), error);
    });
  },
  migrate(files, sourceProvider, destinationOneprovider) {
    const {
      globalNotify,
      transferManager,
    } = this.getProperties('globalNotify', 'transferManager');
    return Promise.all(files.map(file =>
      transferManager.startMigration(
        file,
        sourceProvider,
        destinationOneprovider
      ).then(result => this.updateDataAfterTransferStart(file).then(() => result))
    )).catch(error => {
      globalNotify.backendError(this.t('startingMigration'), error);
    });
  },
  evict(files, sourceOneprovider) {
    const {
      globalNotify,
      transferManager,
    } = this.getProperties('globalNotify', 'transferManager');
    return Promise.all(files.map(file =>
      transferManager.startEviction(file, sourceOneprovider)
      .then(result => this.updateDataAfterTransferStart(file).then(() => result))
    )).catch(error => {
      globalNotify.backendError(this.t('startingEviction'), error);
    });
  },
});
