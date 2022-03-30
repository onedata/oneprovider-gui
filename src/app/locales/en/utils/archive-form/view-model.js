import BaseModel from './-base-model';
import _ from 'lodash';

export default _.merge(_.cloneDeep(BaseModel), {
  config: {
    createNestedArchives: {
      label: 'Nested archives',
      tip: `
        <p>If <strong>enabled</strong>, a separate archive is created for each nested dataset, and a symbolic link to the nested archive is created in the parent archive in the place of the nested dataset's root file/directory. The procedure is recursive and may effectively create a tree of linked archives.</p>
        <p>If <strong>disabled</strong>, the resulting archive is monolithic, i.e. all files and directories from nested datasets has been copied directly to the archive, in their respective locations. Effectively, the internal hierarchy of datasets has no impact on the resulting archive content.</p>
      `,
    },
    incremental: {
      tip: `
        <p>If <strong>enabled</strong>, the archive stores only the files that have changed in comparison to the base archive (provided below). Unchanged files are preserved as hard links to the corresponding files in the base archive.</p>
        <p>If <strong>disabled</strong>, all files belonging to the dataset are stored directly in the archive.</p>
      `,
    },
    baseArchiveGroup: {
      baseArchiveInfo: {
        tip: `
          <p>Base archive for the incremental archive that is referenced in case of unchanged files.</p>
        `,
      },
    },
    includeDip: {
      label: 'DIP included',
      tip: `
        <p>If <strong>enabled</strong>, dissemination information package (DIP) is created alongside with archival information package (AIP), on the storage.</p>
        <p>For more information on DIP and AIP please search for <strong>Open Archival Information System</strong>.</p>
      `,
    },
    followSymlinks: {
      tip: `
        <p>Determines whether symbolic links <strong>pointing to paths outside of the dataset</strong> are resolved during archive creation.</p>
        <p>If <strong>enabled</strong>, valid links are resolved and their target files/directories will be copied to the archive in their place. Invalid symbolic links (not resolvable to a valid path in the space) are ignored and not included in the archive.</p>
        <p>If <strong>disabled</strong>, symbolic links are copied to the resulting archive and their target paths will not be modified. Note that these symbolic links may target modifiable files in the space.</p>
        <p><strong>Note</strong>, that symbolic links pointing to files inside the dataset are always preserved, regardless of this setting. Their target paths are reconstructed to point to the corresponding files in the resulting archive.</p>`,
    },
  },
});
