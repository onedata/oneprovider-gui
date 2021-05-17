export default {
  settingsForm: {
    description: {
      label: 'Description',
    },
    preservedCallback: {
      label: '"Preserved" callback endpoint',
    },
    purgedCallback: {
      label: '"Purged" callback endpoint',
    },
    config: {
      incremental: {
        label: 'Incremental',
      },
      layout: {
        label: 'Layout',
        options: {
          plain: {
            label: 'plain',
          },
          bagit: {
            label: 'bagit',
          },
        },
      },
      includeDip: {
        label: 'Include DIP',
      },
    },
  },
};
