/**
 * Provides migration destination selector. Filters out Oneproviders,
 * which are busy by existing transfers.
 * 
 * @module components/file-distribution-modal/confirm-subsequent-transfer
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { and, not } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['destination-oneprovider-selector'],

  media: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.destinationOneproviderSelector',

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  oneproviders: undefined,

  /**
   * @type {Array<Models.Provider>}
   */
  busyOneproviders: Object.freeze([]),

  /**
   * @virtual
   * @type {Models.Provider}
   */
  sourceOneprovider: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.Provider} destinationOneprovider
   * @returns {Promise}
   */
  onMigrate: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onCancel: notImplementedThrow,

  /**
   * @type {Models.Provider}
   */
  destinationOneproviderItem: undefined,

  /**
   * @type {boolean}
   */
  isSavingNewMigration: false,

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  descriptionText: computed('files.@each.name', function descriptionText() {
    const files = this.get('files');
    if (files) {
      const filesNumber = get(files, 'length') || 0;
      if (filesNumber > 1) {
        return this.t('descriptionForManyFiles');
      } else {
        return this.t('descriptionForOneFile', {
          fileName: get(files, 'firstObject.name'),
        });
      }
    }
  }),

  /**
   * @type {Ember.ComputedProperty<Array<Models.Provider>>}
   */
  oneprovidersDropdownOptions: computed(
    'oneproviders',
    'busyOneproviders',
    'sourceOneprovider',
    function possibleDestinationOneproviders() {
      const {
        oneproviders,
        busyOneproviders,
        sourceOneprovider,
      } = this.getProperties(
        'oneproviders',
        'busyOneproviders',
        'sourceOneprovider'
      );

      return oneproviders
        .without(sourceOneprovider)
        .map(oneprovider => {
          const disabled = busyOneproviders.includes(oneprovider);
          return {
            oneprovider,
            text: get(oneprovider, 'name') + (disabled ? ` (${this.t('busy')})` : ''),
            disabled,
          };
        });
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  canSelectOneprovider: not('isSavingNewMigration'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  canMigrate: and(
    not('isSavingNewMigration'),
    'destinationOneproviderItem'
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  canCancel: not('isSavingNewMigration'),

  init() {
    this._super(...arguments);

    this.set(
      'destinationOneproviderItem',
      this.get('oneprovidersDropdownOptions').rejectBy('disabled')[0]
    );
  },

  actions: {
    selectOneprovider(oneprovider) {
      this.set('destinationOneproviderItem', oneprovider);
    },
    migrate() {
      const {
        destinationOneproviderItem,
        onMigrate,
      } = this.getProperties('destinationOneproviderItem', 'onMigrate');

      this.set('isSavingNewMigration');
      return onMigrate(get(destinationOneproviderItem, 'oneprovider'))
        .finally(() => safeExec(this, () =>
          this.set('isSavingNewMigration', false)
        ));
    },
  },
});
