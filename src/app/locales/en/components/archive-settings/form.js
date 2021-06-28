export default {
  settingsForm: {
    description: {
      label: 'Description',
    },
    preservedCallback: {
      label: '"Preserved" callback URL',
    },
    purgedCallback: {
      label: '"Purged" callback URL',
    },
    config: {
      createNestedArchives: {
        label: 'Create nested archives',
      },
      incremental: {
        label: 'Incremental',
      },
      baseArchiveId: {
        label: 'Base archive ID',
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
