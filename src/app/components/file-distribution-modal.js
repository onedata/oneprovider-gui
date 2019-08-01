import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { Promise } from 'rsvp';
import { writable, conditional, raw, gt, array } from 'ember-awesome-macros';

export default Component.extend(
  I18n,
  createDataProxyMixin('oneproviders', { type: 'array' }),
  createDataProxyMixin('fileDistributions', { type: 'array' }), {
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

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    filesNumber: array.length(array.filterBy(
      'files',
      raw('type'),
      raw('file')
    )),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    directoriesNumber: array.length(array.filterBy(
      'files',
      raw('type'),
      raw('directory')
    )),

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
    activeTab: writable(conditional(
      gt('files.length'), raw(1),
      raw('distribution-summary'),
      raw('distribution-details'),
    )),

    init() {
      this._super(...arguments);

      // Optimalization: get proxies to start loading data before initial render.
      this.getProperties('oneprovidersProxy', 'fileDistributionsProxy');
    },
    
    /**
     * @override
     */
    fetchOneproviders() {
      return get(this.get('space'), 'providerList')
        .then(providerList => get(providerList, 'list'));
    },

    /**
     * @override
     */
    fetchFileDistributions() {
      return Promise.all(
        this.get('files')
          .filterBy('type', 'file')
          .mapBy('fileDistribution')
      );
    },

    actions: {
      changeTab(tab) {
        this.set('activeTab', tab);
      },
      close() {
        this.get('onClose')();
      },
    },
  }
);
