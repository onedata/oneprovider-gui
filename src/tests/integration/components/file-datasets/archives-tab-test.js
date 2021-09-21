import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { get } from '@ember/object';
import { registerService, lookupService } from '../../../helpers/stub-service';
import _ from 'lodash';
import wait from 'ember-test-helpers/wait';
import Service from '@ember/service';
import sleep from 'onedata-gui-common/utils/sleep';
import { click } from 'ember-native-dom-helpers';
import BrowsableArchive from 'oneprovider-gui/utils/browsable-archive';

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

    sleep(1000);

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
    // FIXME: this could be refactored to use generic utils
    const archiveRow = this.$('.fb-table-row')[0];
    await doubleClick(archiveRow);

    const $fileRows = this.$('.fb-table-row');
    expect($fileRows, 'rows').to.have.lengthOf(3);
  });
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
    privileges: {},
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

function mockItems({ testCase, itemsCount }) {
  const archives = _.range(0, itemsCount).map(i => {
    const name = generateItemName(i);
    const entityId = name;
    const archive = BrowsableArchive.create({
      id: generateItemId(entityId),
      entityId,
      name,
      index: name,
      type: 'dir',
      stats: {
        bytesArchived: 0,
        filesArchived: 0,
      },
      relationEntityId(relationName) {
        if (relationName === 'rootDir') {
          return 'dummy_dir_id';
        } else {
          throw new Error(`mock archive relation ${relationName} not implemented`);
        }
      },
    });
    return archive;
  });
  const archiveManager = lookupService(testCase, 'archiveManager');

  const mockArray = new MockArray(archives);
  // FIXME: archive-browser seems to have bug in tests
  archiveManager.fetchDatasetArchives = ({ index, limit, offset }) => {
    return mockArray.fetchChildren(index, limit, offset);
  };
  archiveManager.getBrowsableArchive = (entityId) =>
    mockArray.array.findBy('entityId', entityId);
  return mockArray;
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

  fileManager.fetchDirChildren = (dirId, scope, ...fetchArgs) => {
    return mockArray.fetchChildren(...fetchArgs);
  };
  fileManager.getFileById = (fileId) => {
    if (fileId === 'dummy_dir_id') {
      return dummyDir;
    } else {
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
