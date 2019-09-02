import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { allSettled, Promise } from 'rsvp';
import { raw, array } from 'ember-awesome-macros';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';

export default Component.extend(
  I18n,
  createDataProxyMixin('oneproviders', { type: 'array' }),
  createDataProxyMixin('fileDistributionData', { type: 'array' }), {
    tagName: '',

    i18n: service(),

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
      raw('directory')
    ),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    filesNumber: array.length('filesOfTypeFile'),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    directoriesNumber: array.length('filesOfTypeDir'),

    selectedItemsText: computed(
      'files',
      'filesNumber',
      'directoriesNumber',
      function selectedItemsText() {
        const {
          filesNumber,
          directoriesNumber,
        } = this.getProperties('filesNumber', 'directoriesNumber');

        let text = `${filesNumber + directoriesNumber} `;
        if (directoriesNumber > 0 && filesNumber > 0) {
          text += `(${filesNumber} ${this.t('files')}, `;
          text += `${directoriesNumber} ${this.t('directories')})`;
        } else if (filesNumber > 0) {
          text += `${this.t('files')}`;
        } else {
          text += `${this.t('directories')}`;
        }

        return text;
      }
    ),

    /**
     * This is only an initial value. May by overriden by action `changeTab`.
     * @type {Ember.ComputedProperty<string>}
     */
    // activeTab: writable(conditional(
    //   gt('files.length'), raw(1),
    //   raw('distribution-summary'),
    //   raw('distribution-details'),
    // )),
    activeTab: 'distribution-details',

    init() {
      this._super(...arguments);

      // Optimalization: get proxies to start loading data before initial render.
      this.getProperties('oneprovidersProxy', 'fileDistributionsProxy');
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
          .map(file => FileDistributionDataContainer.create({ file }))
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
        console.log(...arguments);
      },
      migrate(files, sourceProvider, destinationOneprovider) {
        console.log(...arguments);
      },
      invalidate(files, sourceOneprovider) {
        console.log(...arguments);
      },
    },
  }
);
