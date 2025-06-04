export default {
  addNewColumnHeader: 'New metadata column',
  jsonKeyLabel: 'Top-level key:',
  jsonQueryLabel: 'Query:',
  jsonQueryDescription: 'Enter a query using',
  jsonQueryDescription2: 'syntax to extract specific information from the JSON data.',
  jsonataLink: 'https://docs.jsonata.org/overview.html',
  jsonataLinkText: 'JSONata',
  addBtn: 'Create',
  cancelBtn: 'Cancel',
  modifyColumnHeader: 'Modify metadata column',
  modifyBtn: 'Apply',
  backTooltip: 'Back',
  columnExistsTooltip: 'This column already exists.',
  emptyValueTooltip: 'Requires non-empty inputs.',
  columnLabelExistsTooltip: 'Column with this label already exists.',
  invalidJsonataExpressionTooltip: 'Invalid JSONata expression: {{error}}',
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
      query: {
        label: 'Query',
      },
    },
  },
  json: 'JSON',
  jsonQueryColumnLabel: 'JSON query',
  jsonQuery: {
    label: 'Query:',
  },
  columnLabel: {
    label: 'Column label',
  },
};
