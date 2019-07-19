export default function permissionsToObject(
  permissions,
  permissionsGroups,
  context
) {
  permissionsGroups.reduce((tree, group) => {
    const groupPermissions = context ?
      group.permissions.filterBy('context', context): group.permissions;
    tree[group.groupName] = groupPermissions.reduce((groupPerms, permission) => {
      groupPerms[permission.name] = Boolean(permissions & permission.mask);
      return groupPerms;
    }, {});
    return tree;
  }, {});
}
