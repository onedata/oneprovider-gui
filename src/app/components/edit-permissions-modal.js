/**
 * Modal with posix/acl permissions editor for single/multiple files passed via
 * `files` field. This component should be removed just after modal close to
 * optimize rendering.
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
import { Promise, reject, resolve, allSettled } from 'rsvp';
import { array, conditional, raw, equal, and, not, or } from 'ember-awesome-macros';
import isEveryTheSame from 'onedata-gui-common/macros/is-every-the-same';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

/**
 * @typedef {Object} AceSubjectEquivalent Object similar to Models.User/Group,
 *   but representing not existing model interpreted by backend.
 * @property {boolean} isSystemSubject is always `true`
 * @property {string} entityId
 * @property {string} equivalentType 'user' or 'group'
 * @property {string} name
 */

export default Component.extend(
  I18n,
  createDataProxyMixin('spaceUsers', { type: 'array' }),
  createDataProxyMixin('spaceGroups', { type: 'array' }),
  createDataProxyMixin('acls', { type: 'array' }), {
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
     * Array of changed permission types. May contain: 'posix', 'acl' or both of them
     * @type {ComputedProperty<Array<String>>}
     */
    editedPermissionsTypes: computed(() => []),

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
     * List of system subjects, that represents owner of a file/directory, owning
     * group, everyone and anonymous. These are used to define ACE, that are not tied to
     * specific user/group, but rather to some type of user/group. These are provided to
     * preserve compatibility with CDMI.
     * @type {Ember.ComputedProperty<Object>}
     */
    systemSubjects: computed(function systemSubjects() {
      return [{
        isSystemSubject: true,
        entityId: 'OWNER@',
        equivalentType: 'user',
        name: this.t('ownerSystemSubject'),
      }, {
        isSystemSubject: true,
        entityId: 'GROUP@',
        equivalentType: 'group',
        name: this.t('groupSystemSubject'),
      }, {
        isSystemSubject: true,
        entityId: 'EVERYONE@',
        equivalentType: 'group',
        name: this.t('everyoneSystemSubject'),
      }, {
        isSystemSubject: true,
        entityId: 'ANONYMOUS@',
        equivalentType: 'user',
        name: this.t('anonymousSystemSubject'),
      }];
    }),

    /**
     * One of: `file`, `dir`, `mixed`
     * @type {Ember.ComputedProperty<string>}
     */
    filesType: computed('files.@each.type', function filesType() {
      const types = this.get('files').mapBy('type').uniq();
      if (types.length > 1) {
        return 'mixed';
      } else {
        return types[0];
      }
    }),

    /**
     * Active permissions type value inferred from files.
     * @type {Ember.ComputedProperty<string>}
     */
    initialActivePermissionsType: conditional(
      array.isEvery('files', raw('activePermissionsType'), raw('posix')),
      raw('posix'),
      raw('acl')
    ),

    /**
     * True only if all files have consistent `posixPermissions` value.
     * @type {Ember.ComputedProperty<boolean>}
     */
    filesHaveCompatiblePosixPermissions: isEveryTheSame(
      'files',
      raw('posixPermissions')
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
     * to default '664' for files and '775' for directories and mixed if
     * files/directories have different posix permissions.
     * @type {Ember.ComputedProperty<string>}
     */
    initialPosixPermissions: conditional(
      'filesHaveCompatiblePosixPermissions',
      'files.firstObject.posixPermissions',
      conditional(
        equal('filesType', raw('file')),
        raw('664'),
        raw('775')
      )
    ),

    /**
     * True only if all files have consistent ACLs.
     * @type {Ember.ComputedProperty<boolean>}
     */
    filesHaveCompatibleAcl: computed(
      'acls',
      function filesHaveCompatibleAclRules() {
        const acls = this.get('acls');
        if (acls) {
          if (get(acls, 'length') === 1) {
            return true;
          } else {
            const firstFileAcl = acls[0];
            return acls.every(acl => _.isEqual(acl, firstFileAcl));
          }
        } else {
          return false;
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
      'acls.firstObject',
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
      'editedPermissionsTypes.length',
      not('isSaving'),
      'arePosixPermissionsValid'
    ),

    init() {
      this._super(...arguments);

      const {
        initialActivePermissionsType,
        initialPosixPermissions,
      } = this.getProperties(
        'initialActivePermissionsType',
        'initialPosixPermissions',
      );

      this.setProperties({
        activePermissionsType: initialActivePermissionsType,
        posixPermissions: initialPosixPermissions,
      });

      if (initialActivePermissionsType === 'acl') {
        this.initAclValuesOnProxyLoad();
      }
    },

    /**
     * @override
     */
    fetchSpaceUsers() {
      return get(this.get('space'), 'effUserList')
        .then(userList => get(userList, 'list'));
    },

    /**
     * @override
     */
    fetchSpaceGroups() {
      return get(this.get('space'), 'effGroupList')
        .then(userList => get(userList, 'list'));
    },

    /**
     * @override
     */
    fetchAcls() {
      const {
        spaceUsersProxy,
        spaceGroupsProxy,
        systemSubjects,
        files,
      } = this.getProperties(
        'spaceUsersProxy',
        'spaceGroupsProxy',
        'systemSubjects',
        'files'
      );
      return Promise.all([spaceUsersProxy, spaceGroupsProxy])
        // Fetch space users and groups
        .then(([users, groups]) => Promise.all(files.map(file =>
          // Fetch each file ACL
          file.getRelation('acl', { reload: true }).then(acl =>
            // Add subject (user/group model) to each ACE
            get(acl, 'list').map(ace => {
              const {
                identifier,
                aceFlags,
              } = getProperties(ace, 'identifier', 'aceFlags');
              let subject;
              let subjectType;
              if (identifier.indexOf('@') !== -1) {
                subject = systemSubjects.findBy('entityId', identifier);
                subjectType = get(subject, 'equivalentType') || 'group';
              } else if (aceFlags & AceFlagsMasks.IDENTIFIER_GROUP) {
                subject = groups.findBy('entityId', identifier);
                subjectType = 'group';
              } else {
                subject = users.findBy('entityId', identifier);
                subjectType = 'user';
              }
              return _.assign({ subject, subjectType }, ace);
            })
          )
        )));
    },

    initAclValuesOnProxyLoad() {
      const {
        aclsProxy,
        acl,
      } = this.getProperties('aclsProxy', 'acl');
      if (!acl) {
        aclsProxy.then(() => {
          safeExec(this, () => this.set('acl', this.get('initialAcl')));
        });
      }
    },

    /**
     * @returns {Promise}
     */
    save() {
      const {
        acl,
        posixPermissions,
        editedPermissionsTypes,
        files,
      } = this.getProperties(
        'acl',
        'posixPermissions',
        'editedPermissionsTypes',
        'files',
      );

      const savePromises = files.map(file => ({
        file,
        promise: resolve(),
      }));

      if (editedPermissionsTypes.includes('acl')) {
        // All files share the same ACE array, so it can be prepared
        // earlier.
        const aclToSave = acl.map(ace =>
          getProperties(ace, 'aceType', 'identifier', 'aceFlags', 'aceMask')
        );

        savePromises.forEach(savePromise => {
          savePromise.promise = savePromise.promise.then(() =>
            get(savePromise.file, 'acl').then(fileAcl => {
              if (!_.isEqual(get(fileAcl, 'list'), aclToSave)) {
                set(fileAcl, 'list', aclToSave);

                const promise = fileAcl.save().then(() => savePromise.file.reload());
                promise.catch(() => fileAcl.rollbackAttributes());
                return promise;
              } else {
                return resolve();
              }
            })
          );
        });
      }

      if (editedPermissionsTypes.includes('posix')) {
        savePromises.forEach(savePromise => {
          savePromise.promise = savePromise.promise.then(() => {
            const file = savePromise.file;
            const filePosixPermissions = get(file, 'posixPermissions');
            let promise;
            if (filePosixPermissions !== posixPermissions) {
              set(file, 'posixPermissions', posixPermissions);
              promise = file.save();
              promise.catch(() => file.rollbackAttributes());
            } else {
              promise = resolve(file);
            }
            return promise;
          });
        });
      }

      return allSettled(savePromises.mapBy('promise')).then(results => {
        const errors = results.filterBy('state', 'rejected').mapBy('reason');
        if (errors.length) {
          return reject(errors);
        }
      });
    },

    markPermissionsTypeAsEdited(permissionsType) {
      this.set(
        'editedPermissionsTypes',
        [...this.get('editedPermissionsTypes'), permissionsType].uniq()
      );
    },

    actions: {
      activePermissionsTypeChanged(mode) {
        this.set('activePermissionsType', mode);

        if (mode === 'acl') {
          this.initAclValuesOnProxyLoad();
        }
      },
      acceptPosixIncompatibility() {
        this.set('isPosixPermissionsIncompatibilityAccepted', true);
        this.markPermissionsTypeAsEdited('posix');
      },
      acceptAclIncompatibility() {
        this.set('isAclIncompatibilityAccepted', true);
        this.markPermissionsTypeAsEdited('acl');
      },
      posixPermissionsChanged({ permissions, isValid }) {
        this.setProperties({
          posixPermissions: permissions,
          arePosixPermissionsValid: isValid,
        });
        this.markPermissionsTypeAsEdited('posix');
      },
      aclChanged(acl) {
        this.set('acl', acl);
        this.markPermissionsTypeAsEdited('acl');
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
            .then(() => globalNotify.success(this.t('permissionsModifySuccess')))
            .catch(errors => {
              if (errors.length > 1) {
                errors.slice(1).forEach(error =>
                  console.error('edit-permissions-modal:save()', error)
                );
              }
              globalNotify
                .backendError(this.t('modifyingPermissions'), errors[0]);
              // Close without animation to prepare place for error modal
              onClose();
              throw errors;
            });
        }
      },
    },
  }
);
