import Component from '@ember/component';
import PosixPermissions from 'oneprovider-gui/utils/posix-permissions';
import { computed, observer } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const octalRegex = new RegExp('^[0-7]{3}$');

export default Component.extend(I18n, {
  classNames: ['posix-permissions-editor'],

  /**
   * @override
   */
  i18nPrefix: 'components.posixPermissionsEditor',

  /**
   * Posix permissions visible to user (with modifications)
   * @type {Ember.ComputedProperty<Utils.PosixPermissions}
   */
  permissions: computed(() => PosixPermissions.create()),

  /**
   * @type {boolean}
   */
  isOctalInputValid: true,

  octalObserver: observer(
    'permissions.octalRepresentation',
    function octalObserver() {
      // octalRepresentation change automatically changes input to valid value
      this.set('isOctalInputValid', true);
    }
  ),

  actions: {
    octalChanged(newOctal) {
      newOctal = newOctal.trim();
      if (octalRegex.test(newOctal)) {
        this.get('permissions').fromOctalRepresentation(newOctal);
        this.set('isOctalInputValid', true);
      } else {
        this.set('isOctalInputValid', false);
      }
    },
    checkboxChanged(entity, permission, value) {
      this.set(`permissions.${entity}.${permission}`, value);
    },
  },
});
