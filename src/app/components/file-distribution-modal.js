/**
 * Shows data distribution information and handles transfer-related operations
 * for passed files. Allows to show summarized distribution when there are
 * multiple files.
 * 
 * @module components/file-distribution-modal
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { Promise, resolve, allSettled } from 'rsvp';
import { raw, array, sum } from 'ember-awesome-macros';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';
import { getOwner } from '@ember/application';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import $ from 'jquery';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';

export default Component.extend(
  I18n,
  createDataProxyMixin('oneproviders', { type: 'array' }), {
    tagName: '',

    i18n: service(),
    transferManager: service(),
    globalNotify: service(),

    /**
     * @override
     */
    i18nPrefix: 'components.fileDistributionModal',

    /**
     * @virtual
     * @type {Array<Models.File>}
     */
    files: undefined,

    /**
     * @virtual
     * @type {Models.Space}
     */
    space: undefined,

    /**
     * @virtual
     * @type {Function}
     * @returns {undefined}
     */
    onClose: notImplementedIgnore,

    /**
     * @virtual
     * @type {Function}
     */
    getTransfersUrl: notImplementedIgnore,

    /**
     * @virtual
     * @type {Function}
     */
    getProvidersUrl: notImplementedThrow,

    /**
     * @type {Ember.ComputedProperty<Array<Models.File>>}
     */
    filesOfTypeFile: array.filterBy(
      'files',
      raw('type'),
      raw('file')
    ),

    /**
     * @type {Ember.ComputedProperty<Array<Models.File>>}
     */
    filesOfTypeDir: array.filterBy(
      'files',
      raw('type'),
      raw('dir')
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
     * @type {Ember.ComputedProperty<Array<Utils.FileDistributionDataContainer>>}
     */
    fileDistributionData: computed('files.[]', function fileDistributionData() {
      return this.get('files')
        .map(file => FileDistributionDataContainer.create(
          getOwner(this).ownerInjection(), { file }
        ));
    }),

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
      }),

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
      }),

    /**
     * One of: 'distribution-summary', 'distribution-details'.
     * 'distribution-summary' is possible only for multiple files.
     * @type {string}
     */
    activeTab: undefined,

    init() {
      this._super(...arguments);

      this.set(
        'activeTab',
        this.get('files.length') > 1 ? 'distribution-summary' : 'distribution-details'
      );
    },

    didInsertElement() {
      this._super(...arguments);

      const {
        files,
        oneprovidersProxy,
      } = this.getProperties('files', 'oneprovidersProxy');

      // Open file list item if there is only one file
      if (get(files, 'length') === 1) {
        oneprovidersProxy.then(() =>
          next(() => safeExec(this, () =>
            $('.file-distribution-modal .one-collapsible-list-item-header').click()
          ))
        );
      }
    },

    /**
     * @override
     */
    fetchOneproviders() {
      return this.get('space').getRelation('providerList')
        .then(providerList => get(providerList, 'list'))
        .then(list => allSettled(list.invoke('reload')).then(() => list));
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

    actions: {
      changeTab(tab) {
        this.set('activeTab', tab);
      },
      close() {
        this.get('onClose')();
      },
      onShow() {
        this.updateOneprovidersProxy({ replace: true });
        const space = this.get('space');
        if (space.reload) {
          space.reload();
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
      getTransfersUrl(...args) {
        return this.get('getTransfersUrl')(...args);
      },
      getProvidersUrl(...args) {
        return this.get('getProvidersUrl')(...args);
      },
    },
  }
);
