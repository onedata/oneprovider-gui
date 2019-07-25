import { computed } from '@ember/object';
import PrivilegesTreeEditor from 'onedata-gui-common/components/privileges-tree-editor';
import { numberToTree, treeToNumber } from 'oneprovider-gui/utils/acl-permissions-converter';

export default PrivilegesTreeEditor.extend({
  /**
   * @virtual
   * @type {number}
   */
  permissions: undefined,

  /**
   * One of: `file`, `directory`
   * @virtual
   * @type {string}
   */
  context: undefined,

  permissionsTree: computed(
    'permissions',
    'context',
    function permissionsTree() {
      const {
        permissions,
        context,
      } = this.getProperties('permissions', 'context');
      return numberToTree(permissions, context);
    }
  ),
});
