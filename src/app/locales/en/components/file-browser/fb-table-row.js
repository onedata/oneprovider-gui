export default {
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  otherFileSameName: 'Another file has the same name. You may rename one of them to resolve the conflict.',
  hintAclPreview: 'This {{fileType}} uses Access Control List permissions which determines if you can read the contents. ACL details cannot be viewed in share browser.',
  hintForbidden: {
    dir: 'You don\'t have permissions to view the contents of this directory',
    file: 'You don\t have permissions to read this file ',
  },
  status: {
    shared: 'Shared',
    metadata: 'Meta',
    qos: 'QoS',
    acl: 'ACL',
    conflict: 'Conflict',
    forbidden: 'Forbidden',
  },
};
