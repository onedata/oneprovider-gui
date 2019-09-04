/**
 * Functions, that allows to convert ACE permissions between number and object
 * representations.
 * 
 * @module utils/acl-permissions-converter
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import aclPermissionsSpecification from 'oneprovider-gui/utils/acl-permissions-specification';
import _ from 'lodash';

const aclSpecificationList =
  _.flatten(aclPermissionsSpecification.mapBy('privileges'));
  
const aclPermissionsMasks = aclSpecificationList.reduce((map, permission) => {
  permission.context.forEach(context => {
    map[context][permission.name] = permission.mask;
  });
  return map;
}, { file: {}, dir: {} });


/**
 * Converts number to object representation of ACE permissions.
 * @param {number} permissions 
 * @param {string} context one of `file`, `dir`
 * @returns {Object} mapping: groupName -> { permissionName -> boolean }
 */
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

/**
 * Converts object representation of ACE permissions to number.
 * @param {Object} permissionsTree
 *   mapping: groupName -> { permissionName -> boolean }
 * @param {string} context one of `file`, `dir`
 * @returns {number}
 */
export function treeToNumber(permissionsTree, context) {
  const flattenedPermissionsTree = _.assign({}, ..._.values(permissionsTree));
  // only permissions with `true` value
  const permissionNamesList = _.keys(flattenedPermissionsTree)
    .filter(key => flattenedPermissionsTree[key]);
  
  let permissionsNumber = 0;
  permissionNamesList.forEach(permissionName => {
    permissionsNumber |= aclPermissionsMasks[context][permissionName] || 0;
  });

  return permissionsNumber;
}
