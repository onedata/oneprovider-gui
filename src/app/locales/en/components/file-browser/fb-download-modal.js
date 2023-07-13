const questionTemplate = (itemText) =>
  `Do you want to download this ${itemText} to your device?`;

export default {
  header: {
    file: 'File download',
    dir: 'Directory download',
  },
  question: {
    file: questionTemplate('file'),
    dir: questionTemplate('directory and all its contents'),
  },
  tarNote: 'Note, that the directory will be packaged in the tar format.',
  confirmDownload: 'Download',
  cancel: 'Cancel',
};
