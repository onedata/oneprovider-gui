import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { get, set } from '@ember/object';
import { registerService, lookupService } from '../../../helpers/stub-service';
import _ from 'lodash';
import wait from 'ember-test-helpers/wait';
import Service from '@ember/service';
import sleep from 'onedata-gui-common/utils/sleep';
import { click, find, findAll } from 'ember-native-dom-helpers';
import BrowsableArchive from 'oneprovider-gui/utils/browsable-archive';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import sinon from 'sinon';
import { createArchiveRootDir, createEntityId } from '../../../helpers/files';

const ArchiveManager = Service.extend({
  createArchive() {},
  fetchDatasetArchives() {},
  getBrowsableArchive: notStubbed('getBrowsableArchive'),
});

const FileManager = Service.extend({
  fetchDirChildren() {},
  copyOrMoveFile() {},
  createSymlink() {},
  createHardlink() {},
  registerRefreshHandler() {},
  deregisterRefreshHandler() {},
  refreshDirChildren() {},
  getFileDownloadUrl() {},
  getFileById() {},
  createArchive() {},
  dirChildrenRefresh() {},
});

describe('Integration | Component | file datasets/archives tab', function () {
  setupComponentTest('file-datasets/archives-tab', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'archiveManager', ArchiveManager);
    registerService(this, 'fileManager', FileManager);
  });

  it('renders list of archive items', async function () {
    const mockData = new MockData(this);
    const itemsCount = 3;
    mockData.mockArchives({
      itemsCount,
    });

    await render(this);

    expect(findAll('.fb-table-row'), 'rows').to.have.length(itemsCount);
  });

  it('lists archive root dir items when entered some archive', async function () {
    const mockData = new MockData(this);
    const archivesCount = 1;
    const filesCount = 3;
    const mockArray = mockData.mockArchives({
      itemsCount: archivesCount,
    });
    const archive = mockArray.array[0];
    mockData.mockRootFiles({
      archive,
      filesCount,
    });

    await render(this);
    const archiveRow = find('.fb-table-row');
    await doubleClick(archiveRow);

    const fileRows = findAll('.fb-table-row');
    expect(fileRows, 'rows').to.have.lengthOf(3);
  });

  [
    { filesCount: 0 },
    { filesCount: 1 },
  ].forEach(({ filesCount }) => {
    const countText = filesCount > 0 ?
      `${filesCount} file${filesCount > 1 ? 's' : ''}` : 'no files';
    const description =
      `changes archive to DIP when using DIP switch in archive files view (${countText})`;
    it(description, async function () {
      const mockData = new MockData(this);
      const archivesCount = 1;
      const archivesMockArray = mockData.mockArchives({
        testCase: this,
        itemsCount: archivesCount,
      });
      const archive = archivesMockArray.array[0];
      mockData.mockRootFiles({
        archive,
        filesCount,
      });
      mockData.mockDipArchive(archive, this);

      await render(this);

      const archiveRow = find('.fb-table-row');
      await doubleClick(archiveRow);
      const $visibleDipButtons = this.$('.select-archive-dip-btn:visible');
      expect($visibleDipButtons).to.have.lengthOf(1);
      expect($visibleDipButtons).to.be.not.disabled;
      expect($visibleDipButtons.text()).to.match(/^\s*DIP\s*$/);
      await click($visibleDipButtons[0]);
      const currentDirName =
        find('.fb-breadcrumbs-current-dir-button .fb-breadcrumbs-dir-name');
      expect(currentDirName.textContent).to.contain('dip');
      if (filesCount > 0) {
        const fileName = find('.fb-table-row .file-base-name').textContent;
        expect(fileName).to.match(/-dip\s*$/);
      }
    });
  });

  it('invokes archive-manager createArchive from create archive modal',
    async function () {
      const mockData = new MockData(this);
      const archivesCount = 0;
      mockData.mockArchives({
        itemsCount: archivesCount,
      });
      const archiveManager = lookupService(this, 'archiveManager');
      const createArchive = sinon.spy(archiveManager, 'createArchive');

      await render(this);

      const createArchiveBtn = find('.empty-archives-create-action');
      expect(createArchiveBtn, 'create archive button').to.exist;
      await click(createArchiveBtn);
      const createArchiveModal = find('.archive-create-part');
      expect(createArchiveModal).to.exist;
      await click('.submit-archive-creation-btn');

      expect(createArchive).to.be.calledOnce;
    }
  );
});

async function render(testCase) {
  const defaultBrowsableDataset = {
    name: 'Default dataset',
    entityId: 'default_dataset_id',
    state: 'attached',
    browsableType: 'dataset',
  };
  setTestPropertyDefault(
    testCase,
    'resolveFileParentFun',
    () => null,
  );
  setTestPropertyDefault(testCase, 'space', {
    entityId: 'space_id',
    privileges: {
      manageDatasets: true,
      createArchives: true,
    },
  });
  setTestPropertyDefault(testCase, 'browsableDataset', defaultBrowsableDataset);
  setTestPropertyDefault(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  testCase.render(hbs `{{file-datasets/archives-tab
    space=space
    browsableDataset=browsableDataset
    archiveBrowserModelOptions=(hash refreshInterval=0)
  }}`);
  await wait();
}

function setTestPropertyDefault(testCase, propertyName, defaultValue) {
  if (testCase.get(propertyName) === undefined) {
    testCase.set(propertyName, defaultValue);
  }
}

function notStubbed(stubName) {
  return () => {
    throw new Error(`${stubName} is not stubbed`);
  };
}

class MockArray {
  constructor(array) {
    if (!array) {
      throw new Error('test utils MockArray: array not specified');
    }
    this.array = array;
  }
  async fetch(
    fromIndex,
    size = Number.MAX_SAFE_INTEGER,
    offset = 0
  ) {
    const startIndex = fromIndex === null ?
      0 :
      this.array.findIndex(item => get(item, 'index') === fromIndex);
    if (startIndex === -1) {
      return [];
    }
    const startOffset = Math.max(
      0,
      Math.min(startIndex + offset, this.array.length)
    );
    const endOffset = Math.min(startOffset + size, this.array.length);
    return this.array.slice(startOffset, endOffset);
  }
  async fetchChildren(index, limit, offset) {
    const fetchResult = await this.fetch(index, limit, offset);
    const result = { childrenRecords: fetchResult, isLast: fetchResult.length < limit };
    return result;
  }
}

class MockData {
  constructor(testCase) {
    this.testCase = testCase;
  }
  createMockArchive(entityId, name) {
    const testCase = this.testCase;
    return BrowsableArchive
      .create({
        content: {
          id: this.generateItemId(entityId),
          entityId,
          name,
          index: name,
          type: 'dir',
          stats: {
            bytesArchived: 0,
            filesArchived: 0,
          },
          config: {
            includeDip: false,
          },
          rootDirId: '',
          get rootDir() {
            return lookupService(testCase, 'fileManager').getFileById(this.rootDirId);
          },
          relationEntityId(relationName) {
            switch (relationName) {
              case 'rootDir':
                return 'dummy_dir_id';
              case 'relatedAip':
                return null;
              case 'baseArchive':
                return null;
              default:
                throw new Error(`mock archive relation ${relationName} not implemented`);
            }
          },
        },
      });
  }
  generateItemId(entityId) {
    return `archive.${entityId}.instance:private`;
  }
  generateItemName(i) {
    return `archive-${i.toString().padStart(3, '0')}`;
  }
  mockDipArchive(aipArchive) {
    const testCase = this.testCase;
    const aipEntityId = get(aipArchive, 'entityId');
    const name = get(aipArchive, 'name') + '-dip';
    const dipEntityId = aipEntityId + '-dip';
    const rootDirDip = this.rootDirDip;
    const rootDirDipId = get(rootDirDip, 'entityId');
    const dipArchive = BrowsableArchive.create({
      content: {
        id: this.generateItemId(dipEntityId),
        name,
        entityId: dipEntityId,
        index: name,
        type: 'dir',
        description: 'dummy_dip',
        testCase,
        stats: {
          bytesArchived: 0,
          filesArchived: 0,
        },
        config: {
          includeDip: true,
        },
        get rootDir() {
          return lookupService(testCase, 'fileManager').getFileById(rootDirDipId);
        },
        relationEntityId(relationName) {
          switch (relationName) {
            case 'rootDir':
              return rootDirDipId;
            case 'relatedAip':
              return aipEntityId;
            case 'baseArchive':
              return null;
            default:
              throw new Error(`mock dip archive relation ${relationName} not implemented`);
          }
        },
        relatedAip: promiseObject(resolve(aipArchive)),
      },
    });
    set(aipArchive, 'relatedDip', promiseObject(resolve(dipArchive)));
    set(aipArchive, 'config.includeDip', true);
    aipArchive.relationEntityId = (relationName) => {
      switch (relationName) {
        case 'rootDir':
          return 'dummy_dir_id';
        case 'relatedDip':
          return dipEntityId;
        case 'relatedAip':
          return null;
        case 'baseArchive':
          return null;
        default:
          throw new Error(`mock aip archive relation ${relationName} not implemented`);
      }
    };
    return dipArchive;
  }
  mockArchives({ itemsCount }) {
    const testCase = this.testCase;
    const archives = _.range(0, itemsCount).map(i => {
      const name = this.generateItemName(i);
      const entityId = name;
      const archive = this.createMockArchive(entityId, name, testCase);
      return archive;
    });
    const archiveManager = lookupService(testCase, 'archiveManager');

    const mockArray = new MockArray(archives);
    this.archivesMockArray = mockArray;

    archiveManager.fetchDatasetArchives = ({ index, limit, offset }) => {
      return mockArray.fetchChildren(index, limit, offset);
    };
    archiveManager.getBrowsableArchive = async (recordOrEntityId) => {
      const entityId = typeof recordOrEntityId === 'string' ?
        recordOrEntityId : get(recordOrEntityId, 'entityId');
      if (entityId.endsWith('-dip')) {
        const relatedAipId = entityId.match(/(.*)-dip/)[1];
        const aipArchive = mockArray.array.findBy('entityId', relatedAipId);
        const dipArchive = await get(aipArchive, 'relatedDip');
        return dipArchive;
      } else {
        return mockArray.array.findBy('entityId', entityId);
      }
    };
    archiveManager.createArchive = async ( /* dataset, data */ ) => {
      const i = mockArray.array.length;
      mockArray.array.unshift(this.createMockArchive(`new-${i}`, `archive-new-${i}`));
    };
    return mockArray;
  }
  generateFileId(entityId) {
    return `file.${entityId}.instance:private`;
  }
  mockRootFiles({ archive, filesCount }) {
    const testCase = this.testCase;
    const datasetId = 'dataset_id';
    const archiveAipId = 'archive_aip_id';
    const archiveDipId = 'archive_dip_id';

    const rootDirAip = createArchiveRootDir({ datasetId, archiveId: archiveAipId });
    const rootDirAipId = get(rootDirAip, 'entityId');
    const rootDirDip = createArchiveRootDir({ datasetId, archiveId: archiveDipId });
    const rootDirDipId = get(rootDirDip, 'entityId');

    set(archive, 'config.includeDip', true);
    set(archive, 'rootDirId', rootDirAipId);

    this.rootDirAip = rootDirAip;
    this.rootDirDip = rootDirDip;

    const files = _.range(0, filesCount).map(i => {
      const name = `file-${i.toString().padStart(3, '0')}`;
      const entityId = createEntityId(name);
      const file = {
        id: this.generateFileId(entityId),
        entityId,
        name,
        index: name,
        type: 'file',
      };
      file.effFile = file;
      return file;
    });
    const fileManager = lookupService(testCase, 'fileManager');

    const mockArray = new MockArray(files);
    this.filesMockArray = mockArray;

    fileManager.fetchDirChildren = async (dirId, scope, ...fetchArgs) => {
      const result = await mockArray.fetchChildren(...fetchArgs);
      if (dirId === rootDirDipId) {
        result.childrenRecords = _.cloneDeep(result.childrenRecords);
        result.childrenRecords.forEach(file => {
          file.name = file.name + '-dip';
          file.index = file.index + '-dip';
        });
      }
      return result;
    };
    fileManager.getFileById = (fileId) => {
      switch (fileId) {
        case rootDirAipId:
          return rootDirAip;
        case rootDirDipId:
          return rootDirDip;
        default:
          return mockArray.array.findBy('entityId', fileId);
      }
    };
    return mockArray;
  }
}

async function doubleClick(element) {
  click(element);
  await sleep(1);
  await click(element);
  await wait();
}
