import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { allSettled, Promise } from 'rsvp';
import { raw, array, sum } from 'ember-awesome-macros';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';
import { getOwner } from '@ember/application';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';

export default Component.extend(
  I18n,
  createDataProxyMixin('oneproviders', { type: 'array' }),
  createDataProxyMixin('fileDistributionData', { type: 'array' }), {
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

    filesOfTypeFile: array.filterBy(
      'files',
      raw('type'),
      raw('file')
    ),

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

        let text = `${filesNumber + directoriesNumber} `;
        if (directoriesNumber > 0 && filesNumber > 0) {
          text += `- ${filesNumber} ${this.t('files')} (${readableFilesSize}), `;
          text += `${directoriesNumber} ${this.t('directories')}`;
        } else if (filesNumber > 0) {
          text += `${this.t('files')} (${readableFilesSize})`;
        } else {
          text += `${this.t('directories')}`;
        }

        return text;
      }
    ),

    /**
     * One of: 'distribution-summary', 'distribution-details'.
     * 'distribution-summary' is possible only for multiple files.
     * @type {string}
     */
    activeTab: undefined,

    init() {
      this._super(...arguments);

      // Optimalization: get proxies to start loading data before initial render.
      this.getProperties('oneprovidersProxy', 'fileDistributionsProxy');

      this.set(
        'activeTab',
        this.get('files.length') > 1 ? 'distribution-summary' : 'distribution-details'
      );
    },
    
    /**
     * @override
     */
    fetchOneproviders() {
      return get(this.get('space'), 'oneproviderList')
        .then(oneproviderList => get(oneproviderList, 'list'));
    },

    /**
     * @override
     */
    fetchFileDistributionData() {
      return Promise.all(
        this.get('files')
          .map(file => FileDistributionDataContainer.create(
            getOwner(this).ownerInjection(), { file }
          ))
          .map(fddc => allSettled([
            get(fddc, 'fileDistributionModelProxy'),
            get(fddc, 'activeTransfersProxy'),
          ]).then(() => fddc))
      );
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
        ));
      },
      migrate(files, sourceProvider, destinationOneprovider) {
        const transferManager = this.get('transferManager');
        return Promise.all(files.map(file =>
          transferManager.startMigration(
            file,
            sourceProvider,
            destinationOneprovider
          )
        ));
      },
      evict(files, sourceOneprovider) {
        const transferManager = this.get('transferManager');
        return Promise.all(files.map(file =>
          transferManager.startEviction(file, sourceOneprovider)
        ));
      },
    },
  }
);
