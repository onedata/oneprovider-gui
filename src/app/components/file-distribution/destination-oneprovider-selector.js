/**
 * Provides migration destination selector. Filters out Oneproviders,
 * which are in the middle of evicting or have readonly support only.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { and, not } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['destination-oneprovider-selector'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistribution.destinationOneproviderSelector',

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
   * @virtual
   * @type {Array<Models.Provider>}
   */
  evictingOneproviders: Object.freeze([]),

  /**
   * @virtual
   * @type {Models.Provider}
   */
  sourceOneprovider: undefined,

  /**
   * @virtual
   * Ids of Oneproviders that support this space only with readonly storages
   * @type {Array<String>}
   */
  providersWithReadonlySupport: Object.freeze([]),

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
    'evictingOneproviders',
    'sourceOneprovider',
    'providersWithReadonlySupport.[]',
    function possibleDestinationOneproviders() {
      const {
        oneproviders,
        evictingOneproviders,
        sourceOneprovider,
        providersWithReadonlySupport,
      } = this.getProperties(
        'providersWithReadonlySupport',
        'oneproviders',
        'evictingOneproviders',
        'sourceOneprovider'
      );

      return oneproviders
        .without(sourceOneprovider)
        .map(oneprovider => {
          const isEvicting = evictingOneproviders.includes(oneprovider);
          const isReadonly =
            providersWithReadonlySupport.includes(get(oneprovider, 'entityId'));
          const disabled = isEvicting || isReadonly;
          return {
            oneprovider,
            text: get(oneprovider, 'name') +
              (disabled ? ` (${this.t(isReadonly ? 'readonly' : 'evicting')})` : ''),
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
