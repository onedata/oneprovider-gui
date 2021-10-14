export default {
  fileType: {
    file: 'file',
    dir: 'directory',
    symlink: 'symbolic link',
  },
  status: {
    qos: 'QoS',
    dataset: 'Dataset',
  },
  protectionFlagsInfo: {
    metadata: 'This {{fileType}}\'s metadata is write protected.',
    data: 'This {{fileType}}\'s data is write protected.',
    both: 'This {{fileType}}\'s data and metadata are write protected.',
  },
};
