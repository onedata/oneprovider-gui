export default {
  addNewColumnHeader: 'New metadata column',
  columnNameLabel: 'Column label:',
  jsonKeyLabel: 'Top-level key:',
  addBtn: 'Create',
  cancelBtn: 'Cancel',
  modifyColumnHeader: 'Modify metadata column',
  modifyBtn: 'Apply',
  backTooltip: 'Back',
  columnExistsTooltip: 'This column already exists.',
  emptyValueTooltip: 'Requires non-empty inputs.',
  columnLabelExistsTooltip: 'Column with this label already exists.',
  xattrKey: {
    label: 'Extended attribute key',
    customValueInputPlaceholder: 'Enter or choose a key...',
    noMatchesMessage: 'No existing xattrs found',
  },
  jsonKey: {
    label: 'Top-level key',
    customValueInputPlaceholder: 'Enter or choose a key...',
    noMatchesMessage: 'No existing key found',
  },
  metadataType: {
    label: 'Metadata type',
    options: {
      xattr: {
        label: 'xattr',
      },
      json: {
        label: 'JSON',
      },
    },
  },
  jsonType: {
    label: 'Mode',
    options: {
      all: {
        label: 'Whole document',
      },
      key: {
        label: 'Extract key',
      },
    },
  },
};
