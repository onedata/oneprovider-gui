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
        tip: `
          <p class="text-left">If <strong>enabled</strong>, a separate archive will be created for each nested dataset, and a symbolic link to the nested archive will be created in the parent archive in the place of the nested dataset's root file/directory. The procedure is recursive and may effectively create a tree of linked archives.</p>
          <div class="text-left">If <strong>disabled</strong>, the resulting archive will be monolithic, i. e. all files and directories from nested datasets will be copied directly to the archive, in their respective locations. Effectively, the internal hierarchy of datasets has no impact on the resulting archive content.</div>
        `,
      },
      incremental: {
        label: 'Incremental',
        tip: `
          <p class="text-left">If <strong>enabled</strong>, the new archive will store only the files that have changed in comparison to the base archive (provided below). Unchanged files will be preserved as hard links to the corresponding files in the base archive.</p>
          <div class="text-left">If <strong>disabled</strong>, all files belonging to the dataset will be stored directly in the archive.</div>
        `,
      },
      baseArchiveGroup: {
        baseArchiveInfo: {
          label: 'Base archive',
          tip: `
            <p class="text-left">Base archive for the incremental archive that will be referenced in case of unchanged files.</p>
            <div class="text-left">To select a different base archive, locate the desired one in archive browser and use the "${createIncrementalArchive}" action from the context menu.</div>
          `,
        },
      },
      layout: {
        label: 'Layout',
        tip: `
          <p class="text-left">The layout of files and directories in an archive.</p>
          <p class="text-left"><strong>plain</strong> – Structure of the data in the archive is an exact copy of the dataset.</p>
          <div class="text-left"><strong>BagIt</strong> – Data in the archive are stored in The BagIt File Packaging Format.</div>
        `,
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
        tip: `
          <p class="text-left">This flag determines whether dissemination information package (DIP) is created alongside with archival information package (AIP), on the storage.</p>
          <div class="text-left">For more information on DIP and AIP please search for <strong>Open Archival Information System</strong>.</div>
        `,
      },
      followSymlinks: {
        label: 'Follow symbolic links',
        tip: `
          <p class="text-left">Determines whether symbolic links <strong>pointing to paths outside of the dataset</strong> should be resolved during archive creation.</p>
          <p class="text-left">If <strong>enabled</strong>, valid links will be resolved and their target files/directories will be copied to the archive in their place. Invalid symbolic links (not resolvable to a valid path in the space) will be ignored and not included in the archive.</p>
          <p class="text-left">If <strong>disabled</strong>, symbolic links will be copied to the resulting archive and their target paths will not be modified. Note that these symbolic links may target modifiable files in the space.</p>
          <div class="text-left"><strong>Note</strong>, that symbolic links pointing to files inside the dataset are always preserved, regardless of this setting. Their target paths are reconstructed to point to the corresponding files in the resulting archive.</div>`,
      },
    },
    latestArchive: '<em>latest</em>',
  },
};
