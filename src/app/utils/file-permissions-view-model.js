/**
 * Tab model for showing file-permissions in file-info-modal
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { array, conditional, raw, equal } from 'ember-awesome-macros';
import { get, getProperties } from '@ember/object';
import { Promise } from 'rsvp';
import _ from 'lodash';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const mixins = [
  OwnerInjector,
  I18n,
  createDataProxyMixin('spaceUsers', { type: 'array' }),
  createDataProxyMixin('spaceGroups', { type: 'array' }),
  createDataProxyMixin('acls', { type: 'array' }),
];

/**
 * @typedef {'posix'|'acl'} FilePermissionsType
 */

export default EmberObject.extend(...mixins, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.filePermissionsViewModel',

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

  //#region state

  /**
   * @type {FilePermissionsType}
   */
  activePermissionsType: undefined,

  /**
   * Array of changed permission types. May contain single type or both of them
   * @type {ComputedProperty<Array<FilePermissionsType>>}
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

  //#endregion

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
   * ACL rules inferred from files permissions. Fallbacks to default `[]`
   * value if files have different ACL rules.
   * @type {Ember.ComputedProperty<Array<Object>>}
   */
  initialAcl: conditional(
    'filesHaveCompatibleAcl',
    'acls.firstObject',
    raw([]),
  ),

  // FIXME: to implement

  filesHaveCompatiblePosixPermissions: true,

  filesHaveCompatibleAcl: true,

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
});
