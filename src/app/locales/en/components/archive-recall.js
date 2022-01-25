export default {
  archiveRecallStartSuccess: 'Archive recall process successfully started.',
  archiveRecallProcessStart: 'archive recall process start',
  targetNameValidation: {
    exists: 'File with specified name already exists in selected location',
    empty: 'Target name must not be empty',
    recalling: 'Cannot recall the archive to location that is currently recalling',
  },
  header: {
    headerText: 'Recall archive into a selected directory',
    headerTextMobile: 'Recall archive',
    intro: 'You are about to recall an archive – this operation will copy archive contents to selected location. Note that recalling will take some time depending on the size of the archive ({{filesCount}} {{filesText}}, {{size}}) and you will be able to watch recalling progress in file browser.',
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
    pathSummaryInfo: 'The archive will be recalled as a newly created {{fileType}}',
    targetNameInputLabel: 'Target {{fileType}} name',
    targetNameInputPlaceholder: 'Enter target {{fileType}} name...',
    cancel: 'Cancel',
    proceed: 'Proceed',
  },
};
