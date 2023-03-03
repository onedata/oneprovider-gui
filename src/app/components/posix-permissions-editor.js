/**
 * Posix permissions editor, that includes permissions rwx-rwx-rwx
 * representation, octal format and detailed checkboxes overview.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import PosixPermissions from 'oneprovider-gui/utils/posix-permissions';
import { observer, get } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

const octalRegex = new RegExp('^[0-7]{3}$');

export default Component.extend(I18n, {
  classNames: ['posix-permissions-editor'],
  classNameBindings: ['readonly:posix-permissions-editor-readonly'],

  /**
   * @override
   */
  i18nPrefix: 'components.posixPermissionsEditor',

  /**
   * Posix permissions injected to component in octal format
   * @virtual
   * @type {string}
   */
  initialPermissions: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {{ permissions: string, isValid: boolean }}
   * @returns {undefined}
   */
  onChange: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onSave: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {String}
   */
  readonlyTip: '',

  /**
   * Change of this property triggers resetting permissions to initialPermissions.
   * @virtual
   * @type {number}
   */
  lastResetTime: undefined,

  /**
   * Posix permissions visible to user (with modifications)
   * @type {Utils.PosixPermissions}
   */
  permissions: undefined,

  /**
   * @type {boolean}
   */
  isOctalInputValid: true,

  lastResetTimeObserver: observer(
    'lastResetTime',
    function lastResetTimeObserver() {
      this.setPermissionsFromInitial();
    },
  ),

  initialPermissionsObserver: observer(
    'initialPermissions',
    function initialPermissionsObserver() {
      // Init permissions object only one time
      if (this.initialPermissions && !this.permissions) {
        this.setPermissionsFromInitial();
      }
    }
  ),

  octalObserver: observer(
    'permissions.octalRepresentation',
    function octalObserver() {
      // octalRepresentation change automatically changes input to valid value
      this.set('isOctalInputValid', true);
    }
  ),

  init() {
    this._super(...arguments);

    this.initialPermissionsObserver();
  },

  didInsertElement() {
    this._super(...arguments);

    this.get('element')
      .querySelector('.permissions-octal')
      .addEventListener('focus', function onFocus() {
        this.select();
      });
  },

  notifyAboutChange() {
    const {
      permissions,
      isOctalInputValid,
      onChange,
    } = this.getProperties('permissions', 'isOctalInputValid', 'onChange');
    const octalPermissions = get(permissions, 'octalRepresentation');

    onChange({
      permissions: isOctalInputValid ? octalPermissions : undefined,
      isValid: isOctalInputValid,
    });
  },

  setPermissionsFromInitial() {
    const initialPermissionsObject = PosixPermissions.create();
    initialPermissionsObject.fromOctalRepresentation(this.initialPermissions);
    this.set('permissions', initialPermissionsObject);
  },

  actions: {
    octalChanged(newOctal) {
      const trimmedNewOctal = newOctal.trim();
      if (octalRegex.test(trimmedNewOctal)) {
        this.get('permissions').fromOctalRepresentation(trimmedNewOctal);
        this.set('isOctalInputValid', true);
      } else {
        this.set('isOctalInputValid', false);
      }
      this.notifyAboutChange();
    },
    checkboxChanged(entity, permission, newValue) {
      this.set(`permissions.${entity}.${permission}`, newValue);
      this.notifyAboutChange();
    },
    save() {
      const {
        isOctalInputValid,
        onSave,
      } = this.getProperties('isOctalInputValid', 'onSave');

      if (isOctalInputValid) {
        onSave();
      }
    },
  },
});
