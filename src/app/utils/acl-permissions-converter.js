import aclPermissionsSpecification from 'oneprovider-gui/utils/acl-permissions-specification';
import _ from 'lodash';

const aclSpecificationList =
  _.flatten(aclPermissionsSpecification.mapBy('privileges'));

export function numberToTree(permissions, context) {
  const convertedPermissions = {};
  aclPermissionsSpecification.forEach(permissionsGroup => {
    const convertedGroup = {};
    permissionsGroup.privileges
      .filter(permissionSpec => permissionSpec.context.includes(context))
      .forEach(permissionSpec => {
        convertedGroup[permissionSpec.name] =
          Boolean(permissions & permissionSpec.mask);
      });
    convertedPermissions[permissionsGroup.groupName] = convertedGroup;
  });

  return convertedPermissions;
}

export function treeToNumber(permissionsTree, context) {
  const aclSpecListForContext = aclSpecificationList
    .filter(spec => spec.context.includes(context));
  
  const flattenedPermissionsTree = _.assign({}, ..._.values(permissionsTree));
  // only permissions with `true` value
  const permissionNamesList = _.keys(flattenedPermissionsTree)
    .filter(key => flattenedPermissionsTree[key]);
  
  let permissionsNumber = 0;
  permissionNamesList.forEach(permissionName => {
    const permissionSpec =
      aclSpecListForContext.findBy('name', permissionName);
    if (permissionSpec) {
      permissionsNumber |= permissionSpec.mask;
    }
  });

  return permissionsNumber;
}
