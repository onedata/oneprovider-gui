import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { array, and, not } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['destination-oneprovider-selector'],

  media: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.destinationOneproviderSelector',

  /**
   * @virtual
   * @type {Array<Models.Oneprovider>}
   */
  oneproviders: undefined,

  /**
   * @virtual
   * @type {Models.Oneprovider}
   */
  sourceOneprovider: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.Oneprovider} destinationOneprovider
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
   * @type {Models.Oneprovider}
   */
  destinationOneprovider: undefined,

  /**
   * @type {boolean}
   */
  isSavingNewMigration: false,

  /**
   * @type {Ember.ComputedProperty<Array<Models.Oneprovider>>}
   */
  possibleDestinationOneproviders: array.without(
    'oneproviders',
    'sourceOneprovider'
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
    'destinationOneprovider'
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  canCancel: not('isSavingNewMigration'),

  init() {
    this._super(...arguments);

    this.set(
      'destinationOneprovider',
      this.get('possibleDestinationOneproviders')[0]
    );
  },

  actions: {
    selectOneprovider(oneprovider) {
      this.set('destinationOneprovider', oneprovider);
    },
    migrate() {
      const {
        destinationOneprovider,
        onMigrate,
      } = this.getProperties('destinationOneprovider', 'onMigrate');

      this.set('isSavingNewMigration');
      return onMigrate(destinationOneprovider)
        .finally(() => safeExec(this, () =>
          this.set('isSavingNewMigration', false)
        ));
    },
  },
});
