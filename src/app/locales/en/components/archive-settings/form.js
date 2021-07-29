import { createIncrementalArchive } from '../../utils/archive-browser-model';

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
      baseArchiveName: {
        label: 'Base archive',
      },
      layout: {
        label: 'Layout',
        options: {
          plain: {
            label: 'plain',
          },
          bagit: {
            label: 'BagIt',
          },
        },
      },
      includeDip: {
        label: 'Include DIP',
      },
    },
  },
  incrementalTip: {
    latest: `If enabled, new archive will store only files that have changed to <strong>the latest</strong> archive of this dataset. Unchanged files will be preserved as hard links to the base archive.<br>You can select other base archive using "${createIncrementalArchive}" action from an archive context menu.`,
    selected: 'A new archive will store only files that have changed to the base archive. Unchanged files will be preserved as hard links to the base archive.',
  },
};
