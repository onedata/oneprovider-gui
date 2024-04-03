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
import I18n from 'onedata-gui-common/mixins/i18n';
import { Promise, resolve, allSettled } from 'rsvp';
import { raw, array, sum, gt } from 'ember-awesome-macros';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';
import { getOwner } from '@ember/application';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';

const mixins = [
  OwnerInjector,
  I18n,
  createDataProxyMixin('oneproviders', { type: 'array' }),
];

// TODO: VFS-11449 optional file size fetch
export default EmberObject.extend(...mixins, {
  transferManager: service(),
  globalNotify: service(),
  i18n: service(),
  appProxy: service(),

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
   * Initially set in init.
   * @type {'summary'|'details'}
   */
  activeTab: undefined,

  //#endregion

  isMultiFile: gt('itemsNumber', 1),

  /**
   * @type {Ember.ComputedProperty<Array<Models.File>>}
   */
  filesOfTypeFile: array.filterBy(
    'files',
    raw('type'),
    raw('file')
  ),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  itemsNumber: array.length('files'),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesNumber: array.length('filesOfTypeFile'),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  dirsNumber: array.length('filesOfTypeDir'),

  /**
   * @type {Ember.ComputedProperty<number>}
   * if array is empty, the sum is 0
   * if one of element in array is null, the sum is also null
   */
  itemsSize: sum(array.mapBy('files', raw('size'))),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: sum(array.mapBy('filesOfTypeFile', raw('size'))),

  /**
   * @type {Ember.ComputedProperty<number>}
   * if array is empty, the sum is 0
   * if one of element in array is null, the sum is also null
   */
  dirsSize: sum(array.mapBy('filesOfTypeDir', raw('size'))),

  /**
   * @type {ComputedProperty<String>}
   */
  summaryText: computed(
    'itemsNumber',
    'filesNumber',
    'dirsNumber',
    'itemsSize',
    'dirsSize',
    function summaryText() {
      const {
        itemsNumber,
        filesNumber,
        dirsNumber,
        itemsSize,
        dirsSize,
      } = this.getProperties(
        'itemsNumber',
        'filesNumber',
        'dirsNumber',
        'itemsSize',
        'dirsSize',
      );
      let itemNoun;
      const itemsSizeText = bytesToString(itemsSize);

      if (dirsSize == null) {
        return this.t('itemsBatchDescriptionNoStats', { itemsNumber: itemsNumber });
      }
      if (filesNumber === itemsNumber) {
        itemNoun = itemsNumber > 1 ? this.t('files') : this.t('file');
      } else if (dirsNumber === itemsNumber) {
        itemNoun = itemsNumber > 1 ? this.t('dirs') : this.t('dir');
      } else {
        itemNoun = itemsNumber > 1 ? this.t('items') : this.t('item');
      }

      return this.t('filesBatchDescription', {
        itemsNumber: itemsNumber,
        itemNoun: itemNoun,
        itemsSize: itemsSizeText,
      });
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  filesSizeDetails: computed(
    'filesNumber',
    'dirsNumber',
    'filesSize',
    'dirsSize',
    function filesSizeDetails() {
      const {
        filesNumber,
        dirsNumber,
        filesSize,
        dirsSize,
      } = this.getProperties(
        'filesNumber',
        'dirsNumber',
        'filesSize',
        'dirsSize'
      );
      if (filesNumber && dirsNumber && dirsSize != null) {
        return this.t('sizeDetails', {
          fileNoun: filesNumber > 1 ? this.t('files') : this.t('file'),
          filesSize: bytesToString(filesSize),
          directoryNoun: dirsNumber > 1 ? this.t('dirs') : this.t('dir'),
          dirsSize: bytesToString(dirsSize),
        });
      } else {
        return '';
      }
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Array<Utils.FileDistributionDataContainer>>}
   */
  fileDistributionData: computed('files.[]', function fileDistributionData() {
    return this.files.map(file =>
      FileDistributionDataContainer.create(getOwner(this).ownerInjection(), { file })
    );
  }),

  init() {
    this._super(...arguments);

    this.set(
      'activeTab',
      this.get('files.length') > 1 ? 'summary' : 'details'
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

  changeTab(tabName) {
    this.set('activeTab', tabName);
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

  getProvidersUrl({ oneproviderId }) {
    return this.appProxy.callParent('getProvidersUrl', { oneproviderId });
  },
});
