/**
 * Model and logic for file-permissions components
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
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
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import isEveryTheSame from 'onedata-gui-common/macros/is-every-the-same';
import computedT from 'onedata-gui-common/utils/computed-t';
import { translateFileType } from 'onedata-gui-common/utils/file';
import FileConsumerMixin, { computedMultiUsedFileGris } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

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

  //#endregion

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
    'fileTypeTextConfig',
    function effectiveReadonlyTip() {
      if (this.readonlyTip) {
        return this.readonlyTip;
      } else if (this.isRootDir) {
        return this.t('readonlyDueToBeingRootDir');
      } else if (this.metadataIsProtected) {
        return this.t('readonlyDueToMetadataIsProtected');
      } else if (this.isPosixAndNonOwner) {
        return this.t('readonlyDueToPosixNonOwner', {
          fileTypeText: this.fileTypeTextConfig.text,
        });
      } else {
        return '';
      }
    }
  ),

  fileTypeTextConfig: computed('files.@each.type', function fileTypeTextConfig() {
    let fileType = get(this.files[0], 'type');
    let form;
    if (this.files.length === 1) {
      form = 'singular';
    } else {
      form = 'plural';
      if (!this.files.every(file => get(file, 'type') === fileType)) {
        fileType = null;
      }
    }
    const text = translateFileType(this.i18n, fileType, { form });
    return {
      text,
      fileType,
      form,
    };
  }),

  posixNotActiveText: computed('fileTypeTextConfig', function posixNotActiveText() {
    return this.t(`posixNotActive.${this.fileTypeTextConfig.form}`, {
      fileTypeText: this.fileTypeTextConfig.text,
    });
  }),

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
   * Initial selected permissions type for viewing/editing inferred from files.
   * @type {Ember.ComputedProperty<FilePermissionsType>}
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

  /**
   * True only if all files have consistent `posixPermissions` value.
   * @type {Ember.ComputedProperty<boolean>}
   */
  filesHaveCompatiblePosixPermissions: isEveryTheSame(
    'files',
    raw('posixPermissions')
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

  isPermissionsTypeSelectorDisabled: bool(and(
    'effectiveReadonly',
    equal('activePermissionsType', raw('posix')),
  )),

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

  isPosixEditorReadonly: or(
    'effectiveReadonly',
    and(
      equal('activePermissionsType', raw('acl')),
      'isNotFilesOrSpaceOwner',
    )
  ),

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
    const effUserList = await get(this.space, 'effUserList');
    return get(effUserList, 'list');
  },

  /**
   * @override
   */
  async fetchSpaceGroups() {
    const effGroupList = await get(this.space, 'effGroupList');
    return get(effGroupList, 'list');
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
          subject = systemSubjects.findBy('entityId', identifier);
          subjectType = get(subject, 'equivalentType') || 'group';
        } else if (aceFlags & AceFlagsMasks.IDENTIFIER_GROUP) {
          subject = groups.findBy('entityId', identifier);
          subjectType = 'group';
        } else {
          subject = users.findBy('entityId', identifier);
          subjectType = 'user';
        }
        subject = subject ? this.stripSubject(subject) : null;
        return _.assign({ subject, subjectType }, ace);
      });
    });
    return allFulfilled(aclPromises.filter(Boolean));
  },

  stripSubject(record) {
    return getProperties(record, 'name', 'isSystemSubject');
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
  },

  async initAclValuesOnProxyLoad() {
    const {
      aclsProxy,
      acl,
    } = this.getProperties('aclsProxy', 'acl');
    if (!acl) {
      await aclsProxy;
      safeExec(this, 'setAclFromInitial');
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
      this.isPermissionsTypeSelectorDisabled ||
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
  },

  /**
   * @private
   * @returns {Promise}
   */
  saveAllPermissions() {
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
