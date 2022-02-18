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
        tip: '<p>If <strong>enabled</strong>, a separate archive will be created for each nested dataset, and a symbolic link to the nested archive will be created in the parent archive in the place of the nested dataset\'s root file/directory. The procedure is recursive and may effectively create a tree of linked archives.</p><div>If <strong>disabled</strong>, the resulting archive will be monolithic, i. e. all files and directories from nested datasets will be copied directly to the archive, in their respective locations. Effectively, the internal hierarchy of datasets has no impact on the resulting archive content.</div>',
      },
      incremental: {
        label: 'Incremental',
        tip: '<p>If <strong>enabled</strong>, the new archive will store only the files that have changed in comparison to the base archive (provided below). Unchanged files will be preserved as hard links to the corresponding files in the base archive.</p><div>If <strong>disabled</strong>, all files belonging to the dataset will be stored directly in the archive.</div>',
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
