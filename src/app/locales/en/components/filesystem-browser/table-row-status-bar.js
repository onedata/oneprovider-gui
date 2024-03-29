export default {
  fileType: {
    file: 'file',
    dir: 'directory',
    symlink: 'symbolic link',
  },
  otherFileSameName: 'Another file has the same name. You may rename one of them to resolve the conflict.',
  hintAclPreview: 'This {{fileType}} has custom Access Control List, which might limit your permissions to view its contents.',
  hintForbidden: {
    dir: 'You don\'t have permissions to view the contents of this directory',
    file: 'You don\'t have permissions to read this file ',
  },
  status: {
    hardlinks: '{{hardlinkCount}} hard links',
    shared: 'Shared',
    metadata: 'Meta',
    acl: 'ACL',
    conflict: 'Conflict',
    forbidden: 'No access',
  },
  hintOpenData: 'This {{fileType}} is published as Open Data.',
};
