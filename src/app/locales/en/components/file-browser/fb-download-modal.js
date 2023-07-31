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
  confirmDownload: {
    file: 'Download',
    dir: 'Download (tar)',
  },
  cancel: 'Cancel',
};
