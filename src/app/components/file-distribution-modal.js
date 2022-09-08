/**
 * Shows data distribution information and handles transfer-related operations
 * for passed files. Allows to show summarized distribution when there are
 * multiple files.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
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
    i18nPrefix: 'components.fileDistribution',

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
      // FIXME: move to new viewModel
      onShow() {
        this.updateOneprovidersProxy({ replace: true });
        const space = this.get('space');
        if (space.reload) {
          space.reload();
        }
      },
      replicate(files, destinationOneprovider) {
        // ...
      },
      migrate(files, sourceProvider, destinationOneprovider) {
        // ...
      },
      evict(files, sourceOneprovider) {
        // ...
      },
    },
  }
);
