/**
 * Modal with posix/acl permissions editor for single/multiple files passed via
 * `files` field. This component should be removed just after modal close
 * (`onCancel` invocation) to optimize rendering.
 * 
 * @module components/edit-permissions-modal
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed, set, getProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { Promise, reject } from 'rsvp';
import { conditional, raw, array, equal, and, not, or } from 'ember-awesome-macros';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(
  I18n,
  createDataProxyMixin('permissions', { type: 'array' }), {
    tagName: '',

    i18n: service(),
    globalNotify: service(),

    /**
     * @override
     */
    i18nPrefix: 'components.editPermissionsModal',

    /**
     * @virtual
     * @type {Models.Space}
     */
    space: undefined,

    /**
     * @virtual
     * @type {Array<Models.File>}
     */
    files: undefined,

    /**
     * @virtual
     * @type {Function}
     * @returns {undefined}
     */
    onClose: notImplementedIgnore,

    /**
     * One of 'acl', 'posix'
     * @type {string}
     */
    activePermissionsType: undefined,

    /**
     * @type {boolean}
     */
    isSaving: false,

    /**
     * String with octal value from posix editor, ready to be saved.
     * Warning: may be `undefined` if posix editor has invalid values.
     * @type {string|undefined}
     */
    posixPermissions: undefined,

    /**
     * Validation state of posix permissions editor.
     * @type {boolean}
     */
    arePosixPermissionsValid: true,

    /**
     * Array of ACE from ACL editor, ready to be saved (with some
     * preprocessing).
     * @type {Array<Object>}
     */
    acl: undefined,

    /**
     * If true, user has accepted permissions type conflict and allowed
     * edition.
     * @type {boolean}
     */
    isActivePermissionsTypeIncompatibilityAccepted: false,

    /**
     * If true, user has accepted posix permissions conflict and allowed
     * edition.
     * @type {boolean}
     */
    isPosixPermissionsIncompatibilityAccepted: false,

    /**
     * If true, user has accepted ACL permissions conflict and allowed
     * edition.
     * @type {boolean}
     */
    isAclIncompatibilityAccepted: false,

    /**
     * True only if all files have consistent `type` value in permissions
     * model.
     * @type {Ember.ComputedProperty<boolean>}
     */
    filesHaveCompatibleActivePermissionsType: equal(
      array.length(array.uniqBy('permissions', raw('type'))),
      raw(1)
    ),

    /**
     * True if permissions types are not conflicted or conflict was accepted.
     * @type {Ember.ComputedProperty<boolean>}
     */
    activePermissionsTypeCompatible: or(
      'filesHaveCompatibleActivePermissionsType',
      'isActivePermissionsTypeIncompatibilityAccepted'
    ),

    /**
     * Active permissions type value inferred from files permissions. Fallbacks
     * to default 'posix' value if files have different permissions types.
     * @type {Ember.ComputedProperty<string>}
     */
    initialActivePermissionsType: conditional(
      'filesHaveCompatibleActivePermissionsType',
      'permissions.firstObject.type',
      raw(undefined),
    ),

    /**
     * True only if all files have consistent `posixValue` value in permissions
     * model.
     * @type {Ember.ComputedProperty<boolean>}
     */
    filesHaveCompatiblePosixPermissions: equal(
      array.length(array.uniqBy('permissions', raw('posixValue'))),
      raw(1)
    ),

    /**
     * True if Posix permissions are not conflicted or conflict was accepted.
     * @type {Ember.ComputedProperty<boolean>}
     */
    posixPermissionsCompatible: or(
      'filesHaveCompatiblePosixPermissions',
      'isPosixPermissionsIncompatibilityAccepted'
    ),

    /**
     * Posix permissions octal value inferred from files permissions. Fallbacks
     * to default '664' value if files have different posix permissions.
     * @type {Ember.ComputedProperty<string>}
     */
    initialPosixPermissions: conditional(
      'filesHaveCompatiblePosixPermissions',
      'permissions.firstObject.posixValue',
      raw('664'),
    ),

    /**
     * True only if all files have consistent `aclValue` value in permissions
     * model.
     * @type {Ember.ComputedProperty<boolean>}
     */
    filesHaveCompatibleAcl: computed(
      'permissions',
      function filesHaveCompatibleAclRules() {
        const permissions = this.get('permissions');
        if (get(permissions, 'length') === 1) {
          return true;
        } else {
          const filesAclRules = permissions.mapBy('aclValue');
          const firstFileAclRules = filesAclRules[0];
          return filesAclRules
            .without(firstFileAclRules)
            .every(aclRules => _.isEqual(aclRules, firstFileAclRules));
        }
      }
    ),

    /**
     * True if ACLs are not conflicted or conflict was accepted.
     * @type {Ember.ComputedProperty<boolean>}
     */
    aclCompatible: or(
      'filesHaveCompatibleAcl',
      'isAclIncompatibilityAccepted'
    ),

    /**
     * ACL rules inferred from files permissions. Fallbacks to default `[]`
     * value if files have different ACL rules.
     * @type {Ember.ComputedProperty<Array<Object>>}
     */
    initialAcl: conditional(
      'filesHaveCompatibleAcl',
      'permissions.firstObject.aclValue',
      raw([]),
    ),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    posixViewActive: equal('activePermissionsType', raw('posix')),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    aclViewActive: equal('activePermissionsType', raw('acl')),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isSaveEnabled: and(
      'activePermissionsTypeCompatible',
      or(not('posixViewActive'), 'posixPermissionsCompatible'),
      or(not('aclViewActive'), 'aclCompatible'),
      'permissionsProxy.isFulfilled',
      'arePosixPermissionsValid',
      not('isSaving')
    ),

    init() {
      this._super(...arguments);

      this.get('permissionsProxy').then(() => safeExec(this, () => {
        const {
          initialActivePermissionsType,
          initialPosixPermissions,
          initialAcl,
        } = this.getProperties(
          'initialActivePermissionsType',
          'initialPosixPermissions',
          'initialAcl'
        );
        
        // Set initial values to save
        this.setProperties({
          activePermissionsType: initialActivePermissionsType,
          posixPermissions: initialPosixPermissions,
          acl: initialAcl,
        });
      }));
    },

    /**
     * @override
     */
    fetchPermissions() {
      return Promise.all(this.get('files')
        .map(file => get(file, 'permissions'))
      );
    },

    /**
     * @returns {Promise}
     */
    save() {
      const {
        acl,
        posixPermissions,
        permissions,
        activePermissionsType,
      } = this.getProperties(
        'acl',
        'posixPermissions',
        'permissions',
        'activePermissionsType'
      );

      // All files share the same ACE array, so it can be prepared
      // earlier.
      let aclToSave;
      if (activePermissionsType === 'acl') {
        aclToSave = acl.map(ace => {
          const {
            permissions: aclPermissions,
            type,
          } = getProperties(ace, 'permissions', 'type');
          const subjectId = get(ace, 'subject.id');
          return {
            permissions: aclPermissions,
            type,
            subject: subjectId,
          };
        });
      }

      return Promise.all(permissions.map(filePermissions => {
        set(filePermissions, 'type', activePermissionsType);
        if (activePermissionsType === 'posix') {
          set(filePermissions, 'posixValue', posixPermissions);
        } else {
          set(filePermissions, 'aclValue', aclToSave);
        }
        // Convert errors to normal values to not reject Promise.all on first
        // error - try to fulfill as much save requests as possible.
        return filePermissions.save()
          .then(
            () => undefined,
            error => {
              filePermissions.rollbackAttributes();
              return error;
            }
          );
      })).then(errors => {
        errors = errors.filter(e => e);
        // If errors occurred, get first of them and show to user. The rest of
        // them just log to console.
        const errorsCount = get(errors, 'length');
        if (errorsCount) {
          if (errorsCount > 1) {
            errors.slice(1).forEach(error =>
              console.error('edit-permissions-modal:save()', error)
            );
          }
          return reject(errors[0]);
        }
      });
    },

    actions: {
      activePermissionsTypeChanged(mode) {
        this.setProperties({
          activePermissionsType: mode,
          isActivePermissionsTypeIncompatibilityAccepted: true,
        });
      },
      acceptPosixIncompatibility() {
        this.set('isPosixPermissionsIncompatibilityAccepted', true);
      },
      acceptAclIncompatibility() {
        this.set('isAclIncompatibilityAccepted', true);
      },
      posixPermissionsChanged({ permissions, isValid }) {
        this.setProperties({
          posixPermissions: permissions,
          arePosixPermissionsValid: isValid,
        });
      },
      aclChanged(acl) {
        this.set('acl', acl);
      },
      close() {
        this.get('onClose')();
      },
      save(closeCallback) {
        const {
          isSaveEnabled,
          onClose,
          globalNotify,
        } = this.getProperties('isSaveEnabled', 'onClose', 'globalNotify');
        if (isSaveEnabled) {
          return this.save()
            .finally(() => {
              // Trigger modal close
              closeCallback();
            })
            .catch(error => {
              globalNotify
                .backendError(this.tt('modifyingPermissions'), error);
              // Close without animation to prepare place for error modal
              onClose();
              throw error;
            });
        }
      },
    },
  }
);
