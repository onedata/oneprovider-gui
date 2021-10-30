import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import { expect } from 'chai';
import FilesViewContext, { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import { get } from '@ember/object';
import {
  createSpaceRootDir,
  createArchiveRootDir,
  createFile,
  createEntityId,
  createPublicEntityId,
  createShareRootDir,
} from '../../helpers/files';

describe('Integration | Utility | files view context', function () {
  setupComponentTest('test-component', {
    integration: true,
  });

  beforeEach(function () {
    const factory = FilesViewContextFactory.create({ ownerSource: this });
    this.set('factory', factory);
  });

  // FIXME: detects different browserType/share/archive/dataset when comparing to other instance
  // FIXME: generates URL to dataset browser using service if is generated for archived file
  // FIXME: generates URL to regular file browser using service
  // FIXME: generates URL to parent dir of selected files using service to regular file browser
  // FIXME: ^ to archive file browser

  it('has "archive" browser type and valid datasetId and archiveId when constructed from a dir inside an archive',
    async function () {
      const factory = this.get('factory');
      const datasetId = 'dataset_id_123';
      const archiveId = 'archive_id_123';
      const spaceId = 'space_id_123';
      const archiveRootDir = createArchiveRootDir(datasetId, archiveId, spaceId);
      const dir1 = createFile({
        entityId: createEntityId('dir1_id', spaceId),
        name: 'dir1',
        type: 'dir',
        parentObject: archiveRootDir,
      });
      const dir2 = createFile({
        entityId: createEntityId('dir2_id', spaceId),
        name: 'dir2',
        type: 'dir',
        parentObject: dir1,
      });

      const filesViewContext = await factory.createFromFile(dir2);

      expect(get(filesViewContext, 'spaceId')).to.equal(spaceId);
      expect(get(filesViewContext, 'shareId')).to.equal(null);
      expect(get(filesViewContext, 'datasetId')).to.equal(datasetId);
      expect(get(filesViewContext, 'archiveId')).to.equal(archiveId);
      expect(get(filesViewContext, 'browserType')).to.equal('archive');
    }
  );

  it('has "space" browser type and null datasetId and archiveId when constructed from a dir not inside an archive',
    async function () {
      const factory = this.get('factory');
      const spaceId = 'space_id_123';
      const spaceRootDir = createSpaceRootDir(spaceId);
      const dir1 = createFile({
        entityId: createEntityId('dir1_id', spaceId),
        name: 'dir1',
        type: 'dir',
        parentObject: spaceRootDir,
      });
      const dir2 = createFile({
        entityId: createEntityId('dir2_id', spaceId),
        name: 'dir2',
        type: 'dir',
        parentObject: dir1,
      });

      const filesViewContext = await factory.createFromFile(dir2);

      expect(get(filesViewContext, 'spaceId')).to.equal(spaceId);
      expect(get(filesViewContext, 'shareId')).to.equal(null);
      expect(get(filesViewContext, 'datasetId')).to.equal(null);
      expect(get(filesViewContext, 'archiveId')).to.equal(null);
      expect(get(filesViewContext, 'browserType')).to.equal('space');
    }
  );

  it('has "share" browser type and valid shareId when constructed from a dir inside a share',
    async function () {
      const factory = this.get('factory');
      const spaceId = 'space_id_123';
      const shareId = 'share_id_456';
      const spaceRootDir = createShareRootDir(spaceId);
      const dir1 = createFile({
        entityId: createPublicEntityId('dir1_id', shareId, spaceId),
        name: 'dir1',
        type: 'dir',
        scope: 'public',
        parentObject: spaceRootDir,
      });
      const dir2 = createFile({
        entityId: createPublicEntityId('dir2_id', shareId, spaceId),
        name: 'dir2',
        type: 'dir',
        scope: 'public',
        parentObject: dir1,
      });

      const filesViewContext = await factory.createFromFile(dir2);

      expect(get(filesViewContext, 'spaceId')).to.equal(spaceId);
      expect(get(filesViewContext, 'shareId')).to.equal(shareId);
      expect(get(filesViewContext, 'datasetId')).to.equal(null);
      expect(get(filesViewContext, 'archiveId')).to.equal(null);
      expect(get(filesViewContext, 'browserType')).to.equal('share');
    }
  );

  //#region compare test cases

  const differentSpaces = {
    name: 'contexts have different spaces',
    dataA: {
      spaceId: 'space_a',
    },
    dataB: {
      spaceId: 'space_b',
    },
    expectedResult: false,
  };

  const sameSpaces = {
    name: 'contexts have the same space',
    dataA: {
      spaceId: 'space_a',
    },
    dataB: {
      spaceId: 'space_a',
    },
    expectedResult: true,
  };

  const differentArchivesInOneDataset = {
    name: 'contexts are different archives in the same dataset',
    dataA: {
      spaceId: 'space',
      datasetId: 'dataset',
      archiveId: 'archive_a',
    },
    dataB: {
      spaceId: 'space',
      datasetId: 'dataset',
      archiveId: 'archive_b',
    },
    expectedResult: false,
  };

  const differentArchives = {
    name: 'contexts are different archives in different datasets',
    dataA: {
      spaceId: 'space',
      datasetId: 'dataset_a',
      archiveId: 'archive_a',
    },
    dataB: {
      spaceId: 'space',
      datasetId: 'dataset_b',
      archiveId: 'archive_b',
    },
    expectedResult: false,
  };

  const regularAndArchive = {
    name: 'one context is regular space filesystem and other is inside archive in the same space',
    dataA: {
      spaceId: 'space_a',
    },
    dataB: {
      spaceId: 'space_a',
      archiveId: 'archive_a',
      datasetId: 'dataset',
    },
    expectedResult: false,
  };

  const regularAndShare = {
    name: 'one context is regular space filesystem and other is inside share',
    dataA: {
      spaceId: 'space_a',
    },
    dataB: {
      spaceId: 'space_a',
      shareId: 'share_id',
    },
    expectedResult: false,
  };

  [
    differentSpaces,
    sameSpaces,
    differentArchivesInOneDataset,
    differentArchives,
    regularAndArchive,
    regularAndShare,
  ].forEach(testOptions => testCompare(this, testOptions));

  //#endregion
});

function testCompare(testCase, options) {
  const {
    dataA,
    dataB,
    expectedResult,
    name,
  } = options;
  it(`when compared to other context returns ${expectedResult} if ${name}`,
    async function () {
      const filesViewContextA = FilesViewContext.create({ ownerSource: testCase }, dataA);
      const filesViewContextB = FilesViewContext.create({ ownerSource: testCase }, dataB);

      const resultAB = filesViewContextA.isEqual(filesViewContextB);
      const resultBA = filesViewContextB.isEqual(filesViewContextA);

      expect(resultAB).to.equal(resultBA);
      expect(resultAB).to.equal(expectedResult);
    }
  );
}
