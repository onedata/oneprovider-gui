import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import $ from 'jquery';
import wait from 'ember-test-helpers/wait';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import { get } from '@ember/object';
import { registerService, lookupService } from '../../helpers/stub-service';
import _ from 'lodash';
import Service from '@ember/service';

const ArchiveManager = Service.extend({
  createArchive() {},
  fetchDatasetArchives() {},
  getBrowsableArchive: notStubbed('getBrowsableArchive'),
});

class MockArray {
  constructor(array) {
    if (!array) {
      throw new Error('file-browser-test MockArray: array not specified');
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

describe('Integration | Component | archive browser', function () {
  setupComponentTest('archive-browser', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'archiveManager', ArchiveManager);
  });

  it('renders archives on list', async function () {
    const itemsCount = 3;
    mockItems({
      testCase: this,
      itemsCount,
    });

    render(this);
    await wait();

    expect(this.$('.fb-table-row')).to.have.length(itemsCount);
  });

  it('have "create incremental action" for archive item', async function () {
    const itemsCount = 1;
    const mockArray = mockItems({
      testCase: this,
      itemsCount,
    });

    const firstArchiveName = mockArray.array[0].name;

    render(this);
    await wait();

    const $actions = await openItemContextMenu({ name: firstArchiveName });
    expect(
      $actions.find('.file-action-createIncrementalArchive'),
      'create incremental archive item'
    ).to.exist;
  });
});

function render(testCase) {
  const {
    refreshInterval,
    openCreateArchiveModal,
  } = testCase.getProperties('openCreateArchiveModal', 'refreshInterval');
  const defaultDataset = {
    name: 'Default dataset',
    state: 'attached',
  };
  setTestPropertyDefault(
    testCase,
    'customFetchDirChildren',
    notStubbed('customFetchDirChildren')
  );
  setTestPropertyDefault(
    testCase,
    'resolveFileParentFun',
    () => null,
  );
  setTestPropertyDefault(testCase, 'spacePrivileges', {});
  setTestPropertyDefault(testCase, 'spaceId', 'some_space_id');
  setTestPropertyDefault(testCase, 'dataset', defaultDataset);
  setTestPropertyDefault(testCase, 'browserModel', ArchiveBrowserModel.create({
    ownerSource: testCase,
    refreshInterval: refreshInterval || 0,
    openCreateArchiveModal: openCreateArchiveModal ||
      notStubbed('openCreateArchiveModal'),
  }));
  setTestPropertyDefault(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  testCase.render(hbs `<div id="content-scroll">{{file-browser
    browserModel=browserModel
    dir=dataset
    customFetchDirChildren=customFetchDirChildren
    resolveFileParentFun=resolveFileParentFun
    spaceId=spaceId
    spacePrivileges = spacePrivileges
    selectedItems=selectedItems
    selectedItemsForJump=selectedItemsForJump
    isSpaceOwned=true
    fileClipboardMode=fileClipboardMode
    fileClipboardFiles=fileClipboardFiles
    updateDirEntityId=(action updateDirEntityId)
    changeSelectedItems=(action (mut selectedItems))
  }}</div>`);
}

// TODO: VFS-7643 common test utils for browsers

async function openItemContextMenu(item) {
  const $row = getItemRow(item);
  $row[0].dispatchEvent(new Event('contextmenu'));
  await wait();
  const $fileActions = $('.file-actions');
  expect($fileActions, 'file-actions').to.have.length(1);
  return $fileActions;
}

function getItemRow({ entityId, name }) {
  let $row;
  if (entityId) {
    $row = $(`.fb-table-row[data-row-id=${entityId}]`);
  } else {
    $row = $(`.fb-table-row:contains("${name}")`);
  }
  expect($row).to.have.length(1);
  return $row;
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
