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
  questionNestedSharesInfo: 'In case any nested file or directory is shared, this operation will make the Share detached.',
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
        prefix: 'The selection contains 1 element that is shared ',
        suffixOneShare: '1 time.',
        suffixManyShares: '{{sharesCount}} times.',
      },
      andManyShared: {
        prefix: 'The selection contains {{filesCount}} elements that are shared at least once – ',
        suffixOneShare: '1 Share in total.',
        suffixManyShares: '{{sharesCount}} Shares in total.',
      },
    },
  },
  removingSharesInfo: {
    forOneSharedPrefix: 'Removing the element will ',
    forManySharedPrefix: 'Removing the elements will ',
    suffix: {
      forOneShare: {
        withPrivileges: 'remove that Share.',
        withoutPrivileges: 'make that Share detached, as you do not have privileges to delete Shares in this space.',
      },
      forManyShares: {
        withPrivileges: 'remove these Shares.',
        withoutPrivileges: 'make the Shares detached, as you do not have privileges to delete Shares in this space.',
      },
    },
  },
};
