/**
 * Model and logic for file-permissions components
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { set, get, getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import {
  array,
  conditional,
  raw,
  equal,
  or,
  bool,
  promise,
  gt,
  not,
  and,
} from 'ember-awesome-macros';
import { Promise, all as allFulfilled, allSettled, resolve, reject } from 'rsvp';
import _ from 'lodash';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import isEveryTheSame from 'onedata-gui-common/macros/is-every-the-same';
import computedT from 'onedata-gui-common/utils/computed-t';
import { translateFileType } from 'onedata-gui-common/utils/file';
import { numberToTree } from 'oneprovider-gui/utils/acl-permissions-converter';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import FileConsumerMixin, { computedMultiUsedFileGris } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import ignoreForbiddenError from 'onedata-gui-common/utils/ignore-forbidden-error';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';

const mixins = [
  OwnerInjector,
  I18n,
  FileConsumerMixin,
  createDataProxyMixin('spaceUsers', { type: 'array' }),
  createDataProxyMixin('spaceGroups', { type: 'array' }),
  createDataProxyMixin('acls', { type: 'array' }),
];

/**
 * @typedef {'posix'|'acl'} FilePermissionsType
 */

export default EmberObject.extend(...mixins, {
  i18n: service(),
  modalManager: service(),
  globalNotify: service(),
  fileManager: service(),
  currentUser: service(),
  spaceManager: service(),
  groupManager: service(),
  userManager: service(),

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

  //#region state

  /**
   * @override
   */
  fileRequirements: computed('files.[]', function fileRequirements() {
    const properties = Object.freeze([
      'owner',
      'metadataIsProtected',
      'posixPermissions',
      'activePermissionsType',
    ]);
    return this.files.map(file => new FileRequirement({
      fileGri: get(file, 'id'),
      properties,
    }));
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedMultiUsedFileGris('files'),

  /**
   * @type {FilePermissionsType}
   */
  selectedPermissionsType: undefined,

  /**
   * Array of changed permission types. May contain single type or both of them.
   * Initialize on init.
   * @type {ComputedProperty<Array<FilePermissionsType>>}
   */
  editedPermissionsTypes: undefined,

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

  isPosixPermissionsIncompatibilityAccepted: false,

  isAclIncompatibilityAccepted: false,

  /**
   * Hacky way to trigger resetting state of POSIX editor, because it has incomplete
   * DDAU implementation.
   * @type {number}
   */
  lastResetTime: undefined,

  /**
   * If true, current user is considered to have permissions to modify ACL in
   * editor. It is set by default to true, because first computation is asynchronical.
   * @type {boolean}
   */
  hasAclChangePermissions: true,

  /**
   * If true, current user is considered to have permissions to view in the editor.
   * It is set by default to true, because first computation is asynchronical.
   * @type {boolean}
   */
  hasAclReadPermissions: true,

  /**
   * Read-only state of ACL editor when it is saved.
   * @type {boolean}
   */
  hasReadonlyAclRules: false,

  //#endregion

  hasAclEditorPermissions: and('hasAclReadPermissions', 'hasAclChangePermissions'),

  isMultiFile: gt('files.length', 1),

  singleFile: reads('files.firstObject'),

  /**
   * @type {ComputedProperty<PromiseObject<Models.User>>}
   */
  ownerProxy: promise.object(computed('singleFile.owner', async function ownerProxy() {
    return await this.fileManager.getFileOwner(this.singleFile);
  })),

  /**
   * True if any file metadata is protected.
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: array.isAny('files', raw('metadataIsProtected')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effectiveReadonly: or('readonly', 'effectiveReadonlyTip'),

  isRootDir: and(
    not('isMultiFile'),
    not('singleFile.hasParent'),
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effectiveReadonlyTip: computed(
    'readonlyTip',
    'isRootDir',
    'metadataIsProtected',
    'isPosixAndNonOwner',
    'isAclAndSomePosixNonOwned',
    'activePermissionsType',
    'hasReadonlyAclRules',
    'space.currentUserIsOwner',
    'selectedPermissionsType',
    function effectiveReadonlyTip() {
      if (this.readonlyTip) {
        return this.readonlyTip;
      } else if (this.isRootDir) {
        return this.t('readonlyDueToBeingRootDir');
      } else if (this.metadataIsProtected) {
        return this.t('readonlyDueToMetadataIsProtected');
      } else if (this.isPosixAndNonOwner || this.isAclAndSomePosixNonOwned) {
        return this.t('readonlyDueToPosixNonOwner');
      } else if (
        this.activePermissionsType === 'acl' &&
        !get(this.space, 'currentUserIsOwner') &&
        this.hasReadonlyAclRules
      ) {
        return this.t('readonlyDueToAclRules');
      } else {
        return '';
      }
    }
  ),

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
      description: this.t('systemSubjectDescription.group'),
    }, {
      isSystemSubject: true,
      entityId: 'EVERYONE@',
      equivalentType: 'group',
      name: this.t('everyoneSystemSubject'),
      description: this.t('systemSubjectDescription.everyone'),
    }, {
      isSystemSubject: true,
      entityId: 'ANONYMOUS@',
      equivalentType: 'user',
      name: this.t('anonymousSystemSubject'),
      description: this.t('systemSubjectDescription.anonymous'),
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
   * Initial selected permissions type for viewing/editing inferred from files.
   * @type {Ember.ComputedProperty<FilePermissionsType>}
   */
  initialActivePermissionsType: conditional(
    array.isEvery('files', raw('activePermissionsType'), raw('posix')),
    raw('posix'),
    raw('acl')
  ),

  filesHaveTheSamePermissionsType: array.isEvery(
    'files',
    raw('activePermissionsType'),
    'files.0.activePermissionsType'
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

  /**
   * True only if all files have consistent `posixPermissions` value.
   * @type {Ember.ComputedProperty<boolean>}
   */
  filesHaveCompatiblePosixPermissions: isEveryTheSame(
    'files',
    raw('posixPermissions')
  ),

  ownersCount: computed(
    'files.@each.owner',
    function ownersCount() {
      /** @type {Set} */
      const ownerSet = this.files.reduce(
        (currentOwnerSet, file) => {
          currentOwnerSet.add(file.relationEntityId('owner'));
          return currentOwnerSet;
        },
        new Set()
      );
      return ownerSet.size;
    }
  ),

  filesHaveSameOwner: computed('files.@each.owner', function filesHaveSameOwner() {
    if (this.files.length === 1) {
      return true;
    }
    const firstOwnerId = this.files[0].relationEntityId('owner');
    return this.files.every(file => file.relationEntityId('owner') === firstOwnerId);
  }),

  /**
   * True if Posix permissions are not conflicted or conflict was accepted.
   * @type {Ember.ComputedProperty<boolean>}
   */
  posixPermissionsCompatible: or(
    'filesHaveCompatiblePosixPermissions',
    'isPosixPermissionsIncompatibilityAccepted'
  ),

  /**
   * True only if all files have consistent ACLs.
   * @type {Ember.ComputedProperty<boolean>}
   */
  filesHaveCompatibleAcl: computed(
    'acls',
    function filesHaveCompatibleAcl() {
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
   * @type {ComputedProperty<boolean>}
   */
  areActivePermissionsTypeTheSame: computed(
    'isMultiFile',
    'files.@each.activePermissionsType',
    function isActivePermissionsTypeTheSame() {
      if (!this.isMultiFile || !this.files?.length) {
        return true;
      }
      const firstType = get(this.files[0], 'activePermissionsType');
      return this.files.every(file => get(file, 'activePermissionsType') === firstType);
    }
  ),

  /**
   * @type {ComputedProperty<FilePermissionsType|null>}
   */
  activePermissionsType: conditional(
    'areActivePermissionsTypeTheSame',
    'files.0.activePermissionsType',
    raw(null),
  ),

  /**
   * True if ACLs are not conflicted or conflict was accepted.
   * @type {Ember.ComputedProperty<boolean>}
   */
  aclCompatible: or(
    'filesHaveCompatibleAcl',
    'isAclIncompatibilityAccepted'
  ),

  isSomeNonOwnedPosix: computed(
    'files.@each.owner',
    'currentUser.userId',
    function isSomeNonOwnedPosix() {
      const currentUserId = this.currentUser.userId;
      return !this.files?.every(file =>
        !file ||
        get(file, 'activePermissionsType') === 'acl' ||
        file.relationEntityId('owner') === currentUserId
      );
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isAnyModified: bool('editedPermissionsTypes.length'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isCurrentTabModified: computed(
    'selectedPermissionsType',
    'editedPermissionsTypes',
    function isCurrentTabModified() {
      return this.editedPermissionsTypes.includes(this.selectedPermissionsType);
    }
  ),

  isDiscardDisabled: not('isAnyModified'),

  isSaveDisabled: or(
    not('isAnyModified'),
    not('arePosixPermissionsValid'),
  ),

  isSaveDisabledMessage: or(
    and(
      not('isAnyModified'),
      computedT('disabledReason.noChanges')
    ),
    and(
      not('arePosixPermissionsValid'),
      computedT('disabledReason.posixInvalid'),
    ),
    raw(null),
  ),

  isAllFilesOwner: computed('files.@each.owner', function isAllFilesOwner() {
    const currentUserId = this.currentUser.userId;
    return this.files?.every(file => file?.relationEntityId('owner') === currentUserId);
  }),

  isNotFilesOrSpaceOwner: and(
    not('space.currentUserIsOwner'),
    not('isAllFilesOwner'),
  ),

  isPosixAndNonOwner: and(
    equal('activePermissionsType', raw('posix')),
    'isNotFilesOrSpaceOwner',
  ),

  isAclAndSomePosixNonOwned: and(
    not('areActivePermissionsTypeTheSame'),
    not('space.currentUserIsOwner'),
    'isSomeNonOwnedPosix'
  ),

  isPosixEditorReadonly: or(
    'effectiveReadonly',
    and(
      equal('activePermissionsType', raw('acl')),
      'isNotFilesOrSpaceOwner',
    )
  ),

  isLackOfAclEditorPermissions: computed(
    'hasAclEditorPermissions',
    'acl.length',
    function isLackOfAclEditorPermissions() {
      return this.acl?.length &&
        !this.hasAclEditorPermissions;
    }
  ),

  itemTypeText: computed('files.[]', function itemTypeText() {
    return this.files.length === 1 ?
      translateFileType(this.i18n, get(this.files[0], 'type')) :
      this.t('selectedItems');
  }),

  lackOfAclEditorPermissionsText: computed(
    'itemTypeText',
    function lackOfAclEditorPermissionsText() {
      return this.t('lackOfAclPermissionsWarning', { itemType: this.itemTypeText });
    }
  ),

  forbiddenAclEditorText: computed(
    'itemTypeText',
    'files.[]',
    function forbiddenAclEditorText() {
      const itemType = this.files.length === 1 ?
        this.t('forbiddenMessageItemType.' + get(this.files[0], 'type')) :
        this.t('forbiddenMessageItemType.multi');
      return this.t('forbiddenAclEditor', { itemType });
    }
  ),

  /**
   * @type {ComputedProperty<PromiseObject<RecordListContainer<Models.Group>>>}
   */
  spaceGroupsContainerProxy: computed(function spaceGroupsContainerProxy() {
    return promiseObject(this.spaceManager.getSpaceEffGroups(this.space));
  }),

  hasInferredSubjectList: bool('spaceGroupsContainerProxy.content.mightBeIncomplete'),

  init() {
    this._super(...arguments);
    this.clearEditedPermissionsTypes();

    const {
      initialActivePermissionsType,
      initialPosixPermissions,
    } = this.getProperties(
      'initialActivePermissionsType',
      'initialPosixPermissions',
    );

    this.setProperties({
      selectedPermissionsType: initialActivePermissionsType,
      posixPermissions: initialPosixPermissions,
    });

    if (initialActivePermissionsType === 'acl') {
      this.initAclValuesOnProxyLoad();
    }
  },

  /**
   * @override
   */
  async fetchSpaceUsers() {
    let effUserList;
    try {
      effUserList = await get(this.space, 'effUserList');
    } catch (error) {
      ignoreForbiddenError(error);
    }
    if (effUserList) {
      return get(effUserList, 'list').toArray();
    } else {
      const currentUser = this.currentUser.user;
      const spaceId = this.get('space.entityId');
      const spaceGroups = await this.spaceGroupsProxy;
      const spaceGroupIds = spaceGroups.map(group => get(group, 'entityId'));
      const spacePrivateGroups = await allFulfilled(spaceGroupIds.map(groupId => {
        try {
          return this.groupManager.getGroupById(groupId, {
            throughSpaceId: spaceId,
            scope: 'private',
          });
        } catch {
          return null;
        }
      }).filter(Boolean));

      const users = await onlyFulfilledValues(spacePrivateGroups.map(async (group) => {
        const userList = await get(group, 'effUserList');
        return (userList && get(userList, 'list'))?.toArray() ?? [];
      }));
      return _.uniqWith(
        [currentUser, ..._.flatten(users)],
        (a, b) => get(a, 'entityId') === get(b, 'entityId')
      );
    }
  },

  /**
   * @override
   */
  async fetchSpaceGroups() {
    return (await this.spaceGroupsContainerProxy).records;
  },

  /**
   * @override
   */
  async fetchAcls() {
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
    // Fetch space users and groups
    const [
      users,
      groups,
    ] = await allFulfilled([spaceUsersProxy, spaceGroupsProxy]);
    // Fetch each file ACL
    const aclPromises = files.map(async file => {
      const acl = await file.getRelation('acl', { reload: true });
      // Add subject (user/group model) to each ACE
      return get(acl, 'list').map(ace => {
        const {
          identifier,
          aceFlags,
        } = getProperties(ace, 'identifier', 'aceFlags');
        let subject;
        let subjectType;
        if (identifier.indexOf('@') !== -1) {
          subject = systemSubjects.find(sub => get(sub, 'entityId') === identifier);
          subjectType = get(subject, 'equivalentType') || 'group';
        } else if (aceFlags & AceFlagsMasks.IDENTIFIER_GROUP) {
          subject = groups.find(group => get(group, 'entityId') === identifier);
          subjectType = 'group';
        } else {
          subject = users.find(user => get(user, 'entityId') === identifier);
          subjectType = 'user';
        }
        subject = subject ? this.stripSubject(subject) : null;
        return _.assign({ subject, subjectType }, ace);
      });
    });
    return allFulfilled(aclPromises.filter(Boolean));
  },

  /**
   * Compute if provided ACL grants permissions needed for current user to view and edit
   * ACL using the editor.
   * @param {Array<Ace>} acl
   * @returns {boolean}
   */
  async computeHasAclChangePermissions(acl) {
    // current user group list is needed to check group permissions
    await get(this.currentUser.user, 'effGroupList');
    return this.files.every(file => {
      for (const ace of acl) {
        const changeAclPermission =
          this.evaluateUserAcePermission(file, ace, 'change_acl');
        if (changeAclPermission === 'allow') {
          return true;
        } else if (changeAclPermission === 'deny') {
          return false;
        }
      }
      return false;
    });
  },

  async computeHasAclReadPermissions(acl) {
    // current user group list is needed to check group permissions
    await get(this.currentUser.user, 'effGroupList');
    return this.files.every(file => {
      for (const ace of acl) {
        const readAclPermission = this.evaluateUserAcePermission(file, ace, 'read_acl');
        if (readAclPermission === 'allow') {
          return true;
        } else if (readAclPermission === 'deny') {
          return false;
        }
      }
      return false;
    });
  },

  async computeHasAclPermissions(aclPermission) {
    // current user group list is needed to check group permissions
    await get(this.currentUser.user, 'effGroupList');
    if (this.filesHaveCompatibleAcl) {
      // single ACL is used for all files
      return this.files.every(file => {
        for (const ace of this.acl) {
          const readAclPermission =
            this.evaluateUserAcePermission(file, ace, aclPermission);
          if (readAclPermission === 'allow') {
            return true;
          } else if (readAclPermission === 'deny') {
            return false;
          }
        }
        return false;
      });
    } else {
      // check original ACLs for each file, because we cannot determine common ACL for all
      // files
      return _.zip(this.files, this.acls).every(([file, acl]) => {
        for (const ace of acl) {
          const readAclPermission =
            this.evaluateUserAcePermission(file, ace, aclPermission);
          if (readAclPermission === 'allow') {
            return true;
          } else if (readAclPermission === 'deny') {
            return false;
          }
        }
        return false;
      });
    }
  },

  /**
   * @param {Ace} ace
   * @param {'read_acl'|'change_acl'} permission
   * @returns {'allow'|'deny'|'none'}
   */
  evaluateUserAcePermission(file, ace, permission) {
    if (ace.subjectType === 'user') {
      if (ace.identifier === 'OWNER@') {
        if (file.relationEntityId('owner') !== this.currentUser.userId) {
          return 'none';
        }
      } else {
        if (ace.identifier !== this.currentUser.userId) {
          return 'none';
        }
      }
    }

    if (
      ace.subjectType === 'group' && (
        ace.identifier === 'ANONYMOUS@' ||
        (
          ace.identifier !== 'EVERYONE@' &&
          ace.identifier !== 'GROUP@' &&
          !this.isUserEffMemberOfGroupId(this.currentUser.user, ace.identifier)
        )
      )
    ) {
      return 'none';
    }

    const isEnabled = numberToTree(ace.aceMask, get(file, 'type')).acl[permission];
    if (isEnabled) {
      return ace.aceType === 'ALLOW' ? 'allow' : 'deny';
    } else {
      return 'none';
    }
  },

  /**
   * Needs `user.effGroupList` to be loaded!
   * @param {Models.User} user
   * @param {string} groupId
   * @returns {boolean}
   */
  isUserEffMemberOfGroupId(user, groupId) {
    const groupList = get(user, 'effGroupList.content');
    if (!groupList) {
      return undefined;
    }
    const groupsGris = groupList.hasMany('list').ids();
    return groupsGris.some(gri => groupId === parseGri(gri).entityId);
  },

  stripSubject(record) {
    return getProperties(record, 'name', 'isSystemSubject', 'description');
  },

  acceptPosixIncompatibility() {
    this.set('isPosixPermissionsIncompatibilityAccepted', true);
    this.markPermissionsTypeAsEdited('posix');
  },

  acceptAclIncompatibility() {
    this.set('isAclIncompatibilityAccepted', true);
    this.markPermissionsTypeAsEdited('acl');
  },

  markPermissionsTypeAsEdited(permissionsType) {
    this.set(
      'editedPermissionsTypes',
      [...this.get('editedPermissionsTypes'), permissionsType].uniq()
    );
  },

  clearEditedPermissionsTypes() {
    this.set('editedPermissionsTypes', []);
  },

  setAclFromInitial() {
    this.set('acl', _.cloneDeep(this.initialAcl));
    (async () => {
      await this.setAclEditorSelfPermissionsState();
      safeExec(this, 'set', 'hasReadonlyAclRules', !this.hasAclChangePermissions);
    })();
  },

  async setAclEditorSelfPermissionsState() {
    const hasAclReadPermissions =
      await this.computeHasAclPermissions('read_acl');
    const hasAclChangePermissions =
      await this.computeHasAclPermissions('change_acl');
    this.setProperties({
      hasAclReadPermissions,
      hasAclChangePermissions,
    });
  },

  async initAclValuesOnProxyLoad() {
    const {
      aclsProxy,
      acl,
    } = this.getProperties('aclsProxy', 'acl');
    if (!acl) {
      await aclsProxy;
      if (this.isDestroyed || this.isDestroying) {
        return;
      }
      this.setAclFromInitial();
    }
  },

  /**
   * If needed, show unsaved changes prompt with save/restore actions.
   * @returns {Promise<boolean>} If `true` is returned, the tab can be safely closed.
   *   If `false` is returned, you should not close the tab due to unsaved changes.
   */
  async checkCurrentTabClose() {
    return this.isCurrentTabModified ? await this.handleUnsavedChanges() : true;
  },

  /**
   * @param {FilePermissionsType} tabId
   */
  async changeTab(tabId) {
    if (
      tabId === this.selectedPermissionsType ||
      !(await this.checkCurrentTabClose())
    ) {
      return false;
    }

    this.set('selectedPermissionsType', tabId);
    if (tabId === 'acl') {
      this.initAclValuesOnProxyLoad();
    }
  },

  onPosixPermissionsChanged({ permissions, isValid }) {
    this.setProperties({
      posixPermissions: permissions,
      arePosixPermissionsValid: isValid,
    });
    this.markPermissionsTypeAsEdited('posix');
  },

  onAclChanged(acl) {
    this.set('acl', acl);
    this.markPermissionsTypeAsEdited('acl');
    this.setAclEditorSelfPermissionsState();
  },

  /**
   * @private
   * @returns {Promise}
   */
  async saveAllPermissions() {
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

  async submit() {
    if (this.isLackOfAclEditorPermissions) {
      return this.showAclPermissionsWarningModal();
    } else {
      return this.save();
    }
  },

  async showAclPermissionsWarningModal() {
    return this.modalManager.show('question-modal', {
      headerIcon: 'sign-warning-rounded',
      headerText: this.t('aclPermissionsWarningModal.header'),
      descriptionParagraphs: [{
        text: this.lackOfAclEditorPermissionsText,
      }],
      yesButtonText: this.t('aclPermissionsWarningModal.yes'),
      yesButtonType: 'danger',
      noButtonText: this.t('aclPermissionsWarningModal.no'),
      onSubmit: async () => {
        return await this.save();
      },
    }).hiddenPromise;
  },

  async save() {
    if (this.isSaveDisabled) {
      return;
    }
    const files = this.files;
    try {
      await this.saveAllPermissions();
      this.globalNotify.success(this.t('permissionsModifySuccess'));
      this.clearEditedPermissionsTypes();
    } catch (errors) {
      if (errors.length > 1) {
        errors.slice(1).forEach(error =>
          console.error('save file permissions failed', error)
        );
      }
      this.globalNotify.backendError(this.t('modifyingPermissions'), errors[0]);
      throw errors;
    }
    try {
      await this.updateAclsProxy({ replace: true });
    } catch (errors) {
      if (errors.length > 1) {
        errors.slice(1).forEach(error =>
          console.error('refreshing file permissions failed', error)
        );
      }
    } finally {
      safeExec(this, 'set', 'hasReadonlyAclRules', !this.hasAclChangePermissions);
      const hardlinkedFile = files.find(file => get(file, 'hardlinkCount') > 1);
      if (hardlinkedFile) {
        this.fileManager.fileParentRefresh(hardlinkedFile);
      }
    }
  },

  restoreOriginalPermissions() {
    this.setProperties({
      lastResetTime: Date.now(),
      selectedPermissionsType: this.initialActivePermissionsType,
      posixPermissions: this.initialPosixPermissions,
    });
    if (!this.filesHaveCompatibleAcl) {
      this.set('isAclIncompatibilityAccepted', false);
    }
    if (!this.filesHaveCompatiblePosixPermissions) {
      this.set('isPosixPermissionsIncompatibilityAccepted', false);
    }
    this.setAclFromInitial();
    this.clearEditedPermissionsTypes();
  },

  /**
   * If needed, show unsaved changes prompt with save/restore actions.
   * @returns {Promise<boolean>} If `true` is returned, the tab can be safely closed.
   *   If `false` is returned, you should not close the tab due to unsaved changes.
   */
  async checkClose() {
    if (this.isAnyModified) {
      return await this.handleUnsavedChanges();
    } else {
      return true;
    }
  },

  /**
   * @returns {Promise<boolean>} `true` if current tab can be closed.
   */
  async handleUnsavedChanges() {
    return await new Promise(resolve => {
      this.modalManager.show('unsaved-changes-question-modal', {
        onSubmit: async (data) => {
          if (data.shouldSaveChanges) {
            try {
              await this.save();
              resolve(true);
            } catch (error) {
              resolve(false);
            }
          } else {
            this.restoreOriginalPermissions();
            resolve(true);
          }
        },
        onHide() {
          resolve(false);
        },
      });
    });
  },
});
