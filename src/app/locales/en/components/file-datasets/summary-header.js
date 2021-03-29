export default {
  datasets: 'Datasets',
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  hint: {
    title: 'Datasets',
    intro: '[TODO: VFS-7479] (what datasets are; what are datasets in accordance to file or directory)',
    guide: '[TODO: VFS-7479] (what this modal shows and what can you configure here; we can add also documentation link but there is no docs yet)',
    close: 'Close',
  },
  fileProtectionTag: {
    enabled: {
      data: 'Data of this {{fileType}} is write protected',
      metadata: 'Metadata of this {{fileType}} is write protected',
    },
    disabled: {
      data: 'Data of this {{fileType}} is writable',
      metadata: 'Metadata of this {{fileType}} is writable',
    },
  },
  fileProtectionTagTip: {
    enabled: {
      data: '[TODO: VFS-7479] (what does it mean that data of {{fileType}} is write protected)',
      metadata: '[TODO: VFS-7479] (what does it mean that metadata of {{fileType}} is write protected)',
    },
    disabled: {
      data: '[TODO: VFS-7479] (why we show that data of {{fileType}} is writable in contrast to write protection)',
      metadata: '[TODO: VFS-7479] (why we show that metadata of {{fileType}} is writable in contrast to write protection)',
    },
  },
};
