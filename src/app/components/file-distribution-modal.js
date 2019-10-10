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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { Promise, resolve } from 'rsvp';
import { raw, array, sum } from 'ember-awesome-macros';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';
import { getOwner } from '@ember/application';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import $ from 'jquery';

export default Component.extend(
  I18n,
  createDataProxyMixin('oneproviders', { type: 'array' }), {
    tagName: '',

    i18n: service(),
    transferManager: service(),

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
    filesNumber: array.length('filesOfTypeFile'),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    directoriesNumber: array.length('filesOfTypeDir'),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    filesSize: sum(array.mapBy('filesOfTypeFile', raw('size'))),

    /**
     * @type {Ember.ComputedProperty<string>}
     */
    selectedItemsText: computed(
      'filesNumber',
      'directoriesNumber',
      'filesSize',
      function selectedItemsText() {
        const {
          filesNumber,
          directoriesNumber,
          filesSize,
        } = this.getProperties(
          'filesNumber',
          'directoriesNumber',
          'filesSize'
        );
        const readableFilesSize = bytesToString(filesSize);

        const filesNoun = this.t(filesNumber > 1 ? 'files' : 'file');
        const dirNoun = this.t(directoriesNumber > 1 ? 'directories' : 'directory');

        let text = `${filesNumber + directoriesNumber} `;
        if (directoriesNumber && filesNumber) {
          text += `- ${filesNumber} ${filesNoun} (${readableFilesSize}), `;
          text += `${directoriesNumber} ${dirNoun}`;
        } else if (filesNumber > 0) {
          text += `${filesNoun} (${readableFilesSize})`;
        } else {
          text += `${dirNoun}`;
        }

        return text;
      }
    ),

    /**
     * @type {Ember.ComputedProperty<Array<Utils.FileDistributionDataContainer>>}
     */
    fileDistributionData: computed('files.[]', function () {
      return this.get('files')
        .map(file => FileDistributionDataContainer.create(
          getOwner(this).ownerInjection(), { file }
        ));
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
      return get(this.get('space'), 'providerList')
        .then(providerList => get(providerList, 'list'));
    },

    /**
     * @param {Models.File} file 
     * @returns {Promise}
     */
    reloadFileTransfers(file) {
      const fileDistributionData = this.get('fileDistributionData').findBy('file', file);
      if (fileDistributionData) {
        return fileDistributionData.updateTransfersProxy({ replace: true });
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
      replicate(files, destinationOneprovider) {
        const transferManager = this.get('transferManager');
        return Promise.all(files.map(file =>
          transferManager.startReplication(file, destinationOneprovider)
            .then(result => this.reloadFileTransfers(file).then(() => result))
        ));
      },
      migrate(files, sourceProvider, destinationOneprovider) {
        const transferManager = this.get('transferManager');
        return Promise.all(files.map(file =>
          transferManager.startMigration(
            file,
            sourceProvider,
            destinationOneprovider
          ).then(result => this.reloadFileTransfers(file).then(() => result))
        ));
      },
      evict(files, sourceOneprovider) {
        const transferManager = this.get('transferManager');
        return Promise.all(files.map(file =>
          transferManager.startEviction(file, sourceOneprovider)
            .then(result => this.reloadFileTransfers(file).then(() => result))
        ));
      },
    },
  }
);
