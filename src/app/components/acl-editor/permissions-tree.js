import Component from '@ember/component';
import { computed } from '@ember/object';
import aclPermissionsSpecification from 'oneprovider-gui/utils/acl-permissions-specification';
import permissionsToObject from 'oneprovider-gui/utils/permissions-to-object';

export default Component.extend({

  /**
   * @virtual
   * @type {number}
   */
  permissions: undefined,

  /**
   * @virtual
   * @type {string}
   */
  context: undefined,

  /**
   * @virtual
   * @type {string}
   */
  permissionsSpecification: undefined,

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  permissionsTree: computed('permissions', function permissionsTree() {
    const {
      permissions,
      context,
    } = this.getProperties('permissions', 'context');

    return permissionsToObject(
      permissions,
      aclPermissionsSpecification,
      context
    );
  }),
});
