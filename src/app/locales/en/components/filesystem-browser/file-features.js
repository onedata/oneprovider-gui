export default {
  fileType: {
    file: 'file',
    dir: 'directory',
    symlink: 'symbolic link',
  },
  status: {
    qos: 'QoS',
    dataset: 'Dataset',
    recalling: 'Recalling',
  },
  protectionFlagsInfo: {
    metadata: 'This {{fileType}}\'s metadata is write protected.',
    data: 'This {{fileType}}\'s data is write protected.',
    both: 'This {{fileType}}\'s data and metadata are write protected.',
  },
  inheritedTip: {
    qos: {
      directAndAncestor: 'Some QoS requirements are inherited from ancestor directories.',
      ancestor: 'All QoS requirements are inherited from ancestor directories.',
    },
    dataset: 'This {{fileType}} belongs to one or more datasets established on its ancestor directories.',
    // FIXME: tooltip - should be changed to something that has details
    recalling: 'This {{fileType}} belongs to filesystem tree that is currently recalled from an archive.',
  },
};
