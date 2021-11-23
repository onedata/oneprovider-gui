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
        tip: '<p><strong>If enabled</strong>, the new archive will store only the files that have changed in comparison to the base archive (provided below). Unchanged files will be preserved as hard links to the corresponding files in the base archive.</p><div><strong>If disabled</strong>, all files belonging to the dataset will be stored directly in the archive.</div>',
      },
      baseArchiveGroup: {
        baseArchiveInfo: {
          label: 'Base archive',
          tip: `<p>Base archive for the incremental archive that will be referenced in case of unchanged files.</p><div>To select a different base archive, locate the desired one in archive browser and use the "${createIncrementalArchive}" action from the context menu.</div>`,
        },
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
      followSymlinks: {
        label: 'Follow symbolic links',
        tip: '<p><strong>If enabled</strong>, symbolic links in the dataset will be resolved during archive creation and their target files will be copied.</p><div><strong>If disabled</strong>, symbolic links will be copied into the archive and will point to their original target paths.</div>',
      },
    },
    latestArchive: '<em>latest</em>',
  },
};
