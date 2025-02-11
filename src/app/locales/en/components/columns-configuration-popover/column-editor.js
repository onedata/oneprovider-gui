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
  emptyValueTooltip: 'Requires non-empty key and label.',
  columnLabelExistsTooltip: 'Column with this label already exists.',
  xattrKey: {
    label: 'Extended attribute key',
    customValueOptionTextPrefix: 'Custom xattr key...',
    customValueInputPlaceholder: 'Enter an xattr key...',
    placeholder: 'Choose an xattr key...',
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
