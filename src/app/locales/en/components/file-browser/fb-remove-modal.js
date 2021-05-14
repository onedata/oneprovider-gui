export default {
  deleting: 'deleting file(s)',
  delete: 'Delete',
  yes: 'Yes',
  no: 'No',
  questionPrefix: 'Are you sure you want to permanently delete',
  info: {
    name: 'Name',
    size: 'Size',
    modification: 'Modification',
  },
  questionSuffix: {
    file: 'this file?',
    dir: 'this directory and its contents?',
    symlink: 'this symlink?',
    multi: 'these {{count}} items?',
    multiMany: '{{count}} selected items?',
  },
  questionNestedSharesInfo: 'In case any nested file or directory is shared, this operation will make the share detached.',
  sharesCountInfo: {
    forOneSelected: {
      andOneShared: {
        prefix: 'The selected element is shared ',
        suffixOneShare: '1 time.',
        suffixManyShares: '{{sharesCount}} times.',
      },
    },
    forManySelected: {
      andOneShared: {
        prefix: 'The selection contains 1 element, that is shared ',
        suffixOneShare: '1 time.',
        suffixManyShares: '{{sharesCount}} times.',
      },
      andManyShared: {
        prefix: 'The selection contains {{filesCount}} elements that are shared at least once – ',
        suffixOneShare: '1 share in total.',
        suffixManyShares: '{{sharesCount}} shares in total.',
      },
    },
  },
  removingSharesInfo: {
    forOneSharedPrefix: 'Removing the element will ',
    forManySharedPrefix: 'Removing the elements will ',
    suffix: {
      forOneShare: {
        withPrivileges: 'remove that share.',
        withoutPrivileges: 'make that share detached, as you do not have privileges to delete shares in this space.',
      },
      forManyShares: {
        withPrivileges: 'remove these shares.',
        withoutPrivileges: 'make the shares detached, as you do not have privileges to delete shares in this space.',
      },
    },
  },
};
