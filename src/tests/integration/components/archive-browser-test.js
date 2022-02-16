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
import { click } from 'ember-native-dom-helpers';
import sinon from 'sinon';

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

    await render(this);

    expect(this.$('.fb-table-row')).to.have.length(itemsCount);
  });

  it('has "create incremental" action for archive item which opens create archive modal on click',
    async function () {
      const itemsCount = 1;
      const mockArray = mockItems({
        testCase: this,
        itemsCount,
      });
      const firstArchiveName = mockArray.array[0].name;
      const openCreateArchiveModal = sinon.spy();
      this.set('openCreateArchiveModal', openCreateArchiveModal);
      this.set('spacePrivileges', {
        manageDatasets: true,
        createArchives: true,
      });

      await render(this);

      const $actions = await openItemContextMenu({ name: firstArchiveName });
      const $action = $actions.find('.file-action-createIncrementalArchive');
      expect(
        $action,
        'create incremental archive item'
      ).to.exist;
      await click($action[0]);
      expect(openCreateArchiveModal).to.have.been.calledOnce;
      expect(openCreateArchiveModal).to.have.been.calledWith(
        this.get('dataset'), {
          baseArchive: mockArray.array[0],
        }
      );
    }
  );

  it('has "recall" action for archive item that invokes open recall modal on click', async function () {
    const itemsCount = 1;
    const mockArray = mockItems({
      testCase: this,
      itemsCount,
    });
    const firstArchiveName = mockArray.array[0].name;
    const openRecallModal = sinon.spy();
    this.set('openRecallModal', openRecallModal);
    this.set('spacePrivileges', {
      recallArchives: true,
      writeData: true,
    });

    await render(this);

    const $actions = await openItemContextMenu({ name: firstArchiveName });
    const $recallAction = $actions.find('.file-action-recall');
    expect(
      $recallAction,
      'recall archive menu item'
    ).to.have.length(1);
    expect($recallAction.text()).exist.to.contain('Recall to...');
    await click($recallAction[0]);
    expect(openRecallModal).to.have.been.calledOnce;
    expect(openRecallModal).to.have.been.calledWith(mockArray.array[0]);
  });
});

function render(testCase) {
  const {
    refreshInterval,
    openCreateArchiveModal,
    openRecallModal,
  } = testCase.getProperties(
    'refreshInterval',
    'openCreateArchiveModal',
    'openRecallModal'
  );
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
  const spaceDatasetsViewState = {
    browsableDataset: testCase.get('dataset'),
    attachmentState: testCase.get('dataset.state'),
  };
  setTestPropertyDefault(testCase, 'browserModel', ArchiveBrowserModel.create({
    ownerSource: testCase,
    spaceDatasetsViewState,
    refreshInterval: refreshInterval || 0,
    openCreateArchiveModal: openCreateArchiveModal ||
      notStubbed('openCreateArchiveModal'),
    openRecallModal: openRecallModal ||
      notStubbed('openRecallModal'),
  }));
  setTestPropertyDefault(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  testCase.render(hbs `<div id="content-scroll">{{file-browser
    browserModel=browserModel
    dir=dataset
    customFetchDirChildren=customFetchDirChildren
    resolveFileParentFun=resolveFileParentFun
    spaceId=spaceId
    spacePrivileges=spacePrivileges
    selectedItems=selectedItems
    selectedItemsForJump=selectedItemsForJump
    isSpaceOwned=true
    fileClipboardMode=fileClipboardMode
    fileClipboardFiles=fileClipboardFiles
    updateDirEntityId=(action updateDirEntityId)
    changeSelectedItems=(action (mut selectedItems))
  }}</div>`);
  return wait();
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
