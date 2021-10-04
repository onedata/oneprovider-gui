import { fileType, protectionType } from './-common';

export const dataWriteProtectionEnabled =
  'Data write protection causes files and directories to be protected from modifying their content or being deleted. Modification attempts will be rejected with EPERM POSIX error.';

export default {
  fileType,
  protectionType,
  dataset: 'dataset',
  fileProtectionTag: {
    enabled: '{{fileTypeUpper}}\'s {{protectionType}} is write protected',
    disabled: '{{fileTypeUpper}}\'s {{protectionType}} is write enabled',
  },
  fileProtectionTagTip: {
    enabled: {
      data: dataWriteProtectionEnabled,
      metadata: 'Metadata write protection causes files and directories to be protected from modifying their metadata, such as permissions, ACLs, or custom JSON/RDF/xattr metadata. Modification attempts will be rejected with EPERM POSIX error.',
    },
    disabled: 'The {{fileType}}\'s {{protectionType}} is currently not write protected and can be modified with no additional restrictions.',
  },
};
