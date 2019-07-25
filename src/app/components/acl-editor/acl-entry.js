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

  /**
   * @virtual
   * @type {number}
   */
  permissions: reads('entry.permissions'),

  /**
   * @type {Object}
   */
  permissionsTree: undefined,

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
