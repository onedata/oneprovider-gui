import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads, alias } from '@ember/object/computed';
import { numberToTree, treeToNumber } from 'oneprovider-gui/utils/acl-permissions-converter';
import aclPermissionsSpecification from 'oneprovider-gui/utils/acl-permissions-specification';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['acl-entry'],

  /**
   * @override
   */
  i18nPrefix: 'components.aclEditor.aclEntry',

  /**
   * @virtual
   * @type {Components.OneCollapsibleListItem}
   */
  listItem: undefined,

  /**
   * @virtual
   */
  entry: undefined,

  /**
   * One of: `file`, `directory`
   * @virtual
   * @type {string}
   */
  context: undefined,

  /**
   * @type {Function}
   * @param {Object} change { type: string, permissions: number }
   * @returns {undefined}
   */
  onChange: notImplementedIgnore,

  /**
   * @type {Object}
   */
  permissionsTree: undefined,

  /**
   * 
   */
  subject: reads('entry.subject'),

  /**
   * @type {Ember.ComputedProperty}
   */
  aclType: alias('entry.type'),

  /**
   * @type {Object}
   */
  permissionsSpecification: computed(
    'context',
    function permissionsSpecification() {
      const context = this.get('context');
      const filteredPermissions = [];
      aclPermissionsSpecification.forEach(group => {
        const filteredGroup = _.assign({}, group);
        filteredGroup.privileges = group.privileges.filter(permission =>
          permission.context.includes(context)
        );
        if (filteredGroup.privileges.length) {
          filteredPermissions.push(filteredGroup);
        }
      });
      return filteredPermissions;
    }
  ),

  icon: computed('subject', function icon() {
    return 'user';
  }),

  /**
   * @virtual
   * @type {number}
   */
  permissions: reads('entry.permissions'),

  /**
   * Mapping: permsGroupName -> { permName -> boolean }
   * @type {Ember.ComputedProperty<Object>}
   */
  persistedPermissionsTree: computed(
    'permissions',
    'context',
    function initialPermissionsTree() {
      const {
        permissions,
        context,
      } = this.getProperties('permissions', 'context');
      return numberToTree(permissions, context);
    }
  ),

  statusIcons: computed(
    'permissionsTree',
    'permissionsSpecification',
    'aclType',
    function statusIcons() {
      const {
        permissionsTree,
        permissionsSpecification,
        aclType,
        i18n,
      } = this.getProperties('permissionsTree', 'permissionsSpecification', 'aclType', 'i18n');
      return permissionsSpecification.map(permissionsGroup => {
        const {
          groupName,
          privileges: permissions,
        } = permissionsGroup;

        let checkedPermissionsCount = 0;
        permissions.forEach(({ name }) => {
          if (permissionsTree[groupName][name]) {
            checkedPermissionsCount++;
          }
        });
        let stateClass;
        if (checkedPermissionsCount === 0) {
          stateClass = 'unset';
        } else if (checkedPermissionsCount === permissions.length) {
          stateClass = 'checked';
        } else {
          stateClass = 'mixed';
        }

        const groupNameTranslation = i18n.t(`components.aclEditor.permissionGroups.${groupName}`);
        const permissionsCounterString =
          `${checkedPermissionsCount}/${permissions.length}`;
        const permissonsStateTranslation =
          this.t(`aclPermissionState.${aclType}`);
        return {
          icon: permissionsGroup.icon,
          stateClass,
          tooltipText:
            `${groupNameTranslation}: ${permissionsCounterString} ${permissonsStateTranslation}`,
        };
      });
    }
  ),

  init() {
    this._super(...arguments);
    const persistedPermissionsTree = this.get('persistedPermissionsTree');

    this.setProperties({
      permissionsTree: persistedPermissionsTree,
      initialPermissionsTree: persistedPermissionsTree,
    });
  },

  notifyAboutChange() {
    const {
      context,
      aclType,
      permissionsTree,
      onChange,
    } = this.getProperties(
      'context',
      'aclType',
      'permissionsTree',
      'onChange'
    );
    const permissions = treeToNumber(permissionsTree, context);
    onChange({
      type: aclType,
      permissions,
    });
  },

  actions: {
    aclTypeChanged(type) {
      this.set('aclType', type);
      this.notifyAboutChange();
    },
    permissionsChanged(newPermissionsTree) {
      this.set('permissionsTree', newPermissionsTree);
      this.notifyAboutChange();
    },
  },
});
