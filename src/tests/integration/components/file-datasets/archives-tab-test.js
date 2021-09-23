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
import { click } from 'ember-native-dom-helpers';
import BrowsableArchive from 'oneprovider-gui/utils/browsable-archive';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import sinon from 'sinon';

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
    const itemsCount = 3;
    mockItems({
      testCase: this,
      itemsCount,
    });

    render(this);
    await wait();

    expect(this.$('.fb-table-row'), 'rows').to.have.length(itemsCount);
  });

  it('lists archive root dir items when entered some archive', async function () {
    const archivesCount = 1;
    const filesCount = 3;
    mockItems({
      testCase: this,
      itemsCount: archivesCount,
    });
    mockRootFiles({
      testCase: this,
      filesCount,
    });

    render(this);
    await wait();
    const archiveRow = this.$('.fb-table-row')[0];
    await doubleClick(archiveRow);

    const $fileRows = this.$('.fb-table-row');
    expect($fileRows, 'rows').to.have.lengthOf(3);
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
      const archivesCount = 1;
      const archivesMockArray = mockItems({
        testCase: this,
        itemsCount: archivesCount,
      });
      mockDipArchive(archivesMockArray.array[0], this);
      mockRootFiles({
        testCase: this,
        filesCount,
      });

      render(this);
      await wait();
      const archiveRow = this.$('.fb-table-row')[0];
      await doubleClick(archiveRow);
      const $dipBtn = this.$('.select-archive-dip-btn:visible');

      expect($dipBtn).to.have.lengthOf(1);
      expect($dipBtn).to.be.not.disabled;
      expect($dipBtn.text()).to.match(/^\s*DIP\s*$/);
      $dipBtn.click();
      await wait();
      const $currentDirName =
        this.$('.fb-breadcrumbs-current-dir-button .fb-breadcrumbs-dir-name');
      expect($currentDirName.text()).to.contain('dip');
      if (filesCount > 0) {
        const fileName = this.$('.fb-table-row .file-base-name')[0].textContent;
        expect(fileName).to.match(/-dip\s*$/);
      }
    });
  });

  it('invokes archive-manager createArchive from create archive modal',
    async function () {
      const archivesCount = 0;
      mockItems({
        testCase: this,
        itemsCount: archivesCount,
      });
      const archiveManager = lookupService(this, 'archiveManager');
      const createArchive = sinon.spy(archiveManager, 'createArchive');

      render(this);
      await wait();

      const $createArchiveBtn = this.$('.fb-toolbar-button.file-action-createArchive');
      expect($createArchiveBtn, 'create archive button').to.exist;
      expect($createArchiveBtn, 'create archive button').to.not.have.class('disabled');
      $createArchiveBtn.click();
      await wait();
      const $createArchiveModal = this.$('.archive-settings-part');
      expect($createArchiveModal).to.exist;
      const $submitBtn = this.$('.submit-archive-creation-btn');
      $submitBtn.click();
      await wait();
      expect(createArchive).to.be.calledOnce;
    }
  );
});

// FIXME: clean up unnecessary properties

function render(testCase) {
  const defaultDataset = {
    name: 'Default dataset',
    state: 'attached',
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
  setTestPropertyDefault(testCase, 'dataset', defaultDataset);
  setTestPropertyDefault(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  testCase.render(hbs `{{file-datasets/archives-tab
    space=space
    dataset=dataset
    archiveBrowserModelOptions=(hash refreshInterval=0)
  }}`);
}

// FIXME: common browser tests redundancy

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

// FIXME: archive-browser-test redundancy

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

function generateItemId(entityId) {
  return `archive.${entityId}.instance:private`;
}

function generateItemName(i) {
  return `archive-${i.toString().padStart(3, '0')}`;
}

function createMockArchive(entityId, name, testCase) {
  return BrowsableArchive
    // .extend({
    //   rootDir: computed(function rootDir() {
    //     return this.get('testCase.filesMockArray').getFileById('dummy_dir_id');
    //   }),
    // })
    .create({
      content: {
        id: generateItemId(entityId),
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
        get rootDir() {
          return lookupService(testCase, 'fileManager').getFileById('dummy_dir_id');
        },
        relationEntityId(relationName) {
          if (relationName === 'rootDir') {
            return 'dummy_dir_id';
          } else {
            throw new Error(`mock archive relation ${relationName} not implemented`);
          }
        },
      },
    });
}

function mockItems({ testCase, itemsCount }) {
  const archives = _.range(0, itemsCount).map(i => {
    const name = generateItemName(i);
    const entityId = name;
    const archive = createMockArchive(entityId, name, testCase);
    return archive;
  });
  const archiveManager = lookupService(testCase, 'archiveManager');

  const mockArray = new MockArray(archives);
  testCase.set('archivesMockArray', mockArray);

  // FIXME: archive-browser seems to have bug in tests
  archiveManager.fetchDatasetArchives = ({ index, limit, offset }) => {
    return mockArray.fetchChildren(index, limit, offset);
  };
  archiveManager.getBrowsableArchive = async (entityId) => {
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
    mockArray.array.unshift(createMockArchive(`new-${i}`, `archive-new-${i}`));
  };
  return mockArray;
}

function mockDipArchive(aipArchive, testCase) {
  const aipEntityId = get(aipArchive, 'entityId');
  const name = get(aipArchive, 'name') + '-dip';
  const dipEntityId = aipEntityId + '-dip';
  const dipArchive = BrowsableArchive.create({
    content: {
      id: generateItemId(dipEntityId),
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
        return lookupService(testCase, 'fileManager').getFileById('dummy_dip_dir_id');
      },
      relationEntityId(relationName) {
        switch (relationName) {
          case 'rootDir':
            return 'dummy_dip_dir_id';
          case 'relatedAip':
            return aipEntityId;
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
      default:
        throw new Error(`mock aip archive relation ${relationName} not implemented`);
    }
  };
}

function generateFileId(entityId) {
  return `file.${entityId}.instance:private`;
}

function mockRootFiles({ testCase, filesCount }) {
  const dummyDir = {
    id: generateFileId('dummy_dir_id'),
    entityId: 'dummy_dir_id',
    name: 'archive_root',
    index: 'archive_root',
    type: 'dir',
  };

  const dummyDipDir = {
    id: generateFileId('dummy_dip_dir_id'),
    entityId: 'dummy_dip_dir_id',
    name: 'dip_archive_root',
    index: 'dip_archive_root',
    type: 'dir',
  };

  const files = _.range(0, filesCount).map(i => {
    const name = `file-${i.toString().padStart(3, '0')}`;
    const entityId = name;
    const file = {
      id: generateFileId(entityId),
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
  testCase.set('filesMockArray', mockArray);

  fileManager.fetchDirChildren = async (dirId, scope, ...fetchArgs) => {
    const result = await mockArray.fetchChildren(...fetchArgs);
    if (dirId === 'dummy_dip_dir_id') {
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
      case 'dummy_dir_id':
        return dummyDir;
      case 'dummy_dip_dir_id':
        return dummyDipDir;
      default:
        return mockArray.array.findBy('entityId', fileId);
    }
  };
  return mockArray;
}

async function doubleClick(element) {
  click(element);
  await sleep(1);
  await click(element);
  await wait();
}
