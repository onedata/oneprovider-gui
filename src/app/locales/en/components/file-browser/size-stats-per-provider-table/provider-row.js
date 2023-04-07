export default {
  containsLabel: 'Contains',
  logicalSizeLabel: 'Logical size',
  physicalSizeLabel: 'Physical size',
  elementsCount: {
    template: '{{fileCount}} {{fileNoun}}, {{dirCount}} {{dirNoun}}',
    templateExtraInfo: ' ({{totalCount}} {{elementNoun}} in total)',
    file: {
      singular: 'file',
      plural: 'files',
    },
    dir: {
      singular: 'directory',
      plural: 'directories',
    },
    element: {
      singular: 'element',
      plural: 'elements',
    },
  },
};
