export default {
  archiveRecallStartSuccess: 'Archive recall process successfully started.',
  archiveRecallProcessStart: 'archive recall process start',
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  browserValidation: {
    recalling: 'Cannot recall here – selected directory is currently being recalled',
  },
  targetNameValidation: {
    exists: 'This filename is already in use',
    empty: 'Filename cannot be empty',
    dots: 'Filename "{{targetName}}" is not alllowed',
    slash: 'Filename cannot contain "/" character',
  },
  header: {
    headerText: 'Recall archive',
    intro: 'This operation will copy the archive contents to a selected destination. The recall process might take some time, depending on the size of the archive. Its progress and status will be visible in the file browser.',
    selectDestination: 'Select archive recall destination',
    unknownNumberOf: 'unknown number of',
    unknownSize: 'unknown size',
    filesText: {
      singular: 'file',
      plural: 'files',
    },
    recallHintTitle: 'Recall archive into a selected directory',
    hintClose: 'OK',
  },
  footer: {
    fileType: {
      file: 'file',
      dir: 'directory',
    },
    pathSummaryInfo: 'The archive will be recalled as a new {{fileType}}',
    targetNameInputLabel: 'Target {{fileType}} name',
    targetNameInputPlaceholder: 'Enter target {{fileType}} name...',
    cancel: 'Cancel',
    proceed: 'Recall',
  },
};
