import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { get } from '@ember/object';
import { registerService, lookupService } from '../../../helpers/stub-service';
import _ from 'lodash';
import wait from 'ember-test-helpers/wait';
import Service from '@ember/service';

const ArchiveManager = Service.extend({
  createArchive() {},
  fetchDatasetArchives() {},
  getBrowsableArchive: notStubbed('getBrowsableArchive'),
});

describe('Integration | Component | file datasets/archives tab', function () {
  setupComponentTest('file-datasets/archives-tab', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'archiveManager', ArchiveManager);
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
    fetchChildren=customFetchDirChildren
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
    console.dir(result);
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
    const archive = {
      id: generateItemId(entityId),
      entityId,
      name,
      index: name,
      type: 'dir',
      stats: {
        bytesArchived: 0,
        filesArchived: 0,
      },
    };
    return archive;
  });
  const archiveManager = lookupService(testCase, 'archiveManager');

  const mockArray = new MockArray(archives);
  archiveManager.fetchDatasetArchives = (datasetId, ...args) =>
    mockArray.fetchChildren(...args);
  testCase.set(
    'customFetchDirChildren',
    archiveManager.fetchDatasetArchives.bind(archiveManager)
  );
  return mockArray;
}
