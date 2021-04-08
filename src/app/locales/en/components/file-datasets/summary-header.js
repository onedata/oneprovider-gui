import { fileType, protectionType } from '../file-datasets/-common';

export const dataWriteProtectionEnabled =
  'Data write protection causes files and directories to be protected from modifying their content or being deleted. Modification attempts will be rejected with EPERM POSIX error.';

export default {
  fileType,
  protectionType,
  datasets: 'Datasets',
  hint: {
    title: 'Datasets',
    intro: 'Datasets allow the space users to organize their data into collections with desired granularity. A file or directory marked as a dataset offers additional features, such as optional data and metadata protection or the ability to create persistent snapshots of the physical dataset contents. In case of a directory, a dataset covers all its subdirectories and files. Datasets can be nested, allowing users to compose arbitrary hierarchical structures.',
    guide: 'This view presents a summary of datasets concerning the selected file/directory. It can be individually marked as a dataset with optional write protection settings, nevertheless all ancestor datasets (ones that contain the file/directory) are also considered when determining the effective write protection – presented in the top-right corner. This is depicted in the below table, which allows manipulating the settings for each dataset in the hierarchy.',
    close: 'OK',
  },
  fileProtectionTag: {
    enabled: '{{fileTypeUpper}} {{protectionType}} is write protected',
    disabled: '{{fileTypeUpper}} {{protectionType}} is write enabled',
  },
  fileProtectionTagTip: {
    enabled: {
      data: dataWriteProtectionEnabled,
      metadata: 'Metadata write protection causes files and directories to be protected from modifying their metadata, such as permissions, ACLs, or custom JSON/RDF/xattr metadata. Modification attempts will be rejected with EPERM POSIX error.',
    },
    disabled: 'The {{fileType}} {{protectionType}} is currently not write protected and can be modified with no additional restrictions.',
  },
};
