import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, findAll } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import { get, setProperties } from '@ember/object';
import { registerService, lookupService } from '../../helpers/stub-service';
import _ from 'lodash';
import Service from '@ember/service';
import sinon from 'sinon';
import { openFileContextMenu } from '../../helpers/item-browser';
import { findByText } from '../../helpers/find';

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

describe('Integration | Component | archive-browser', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'archiveManager', ArchiveManager);
  });

  afterEach(function () {
    this.get('browserModel')?.destroy();
  });

  it('renders archives on list', async function () {
    const itemsCount = 3;
    mockItems({
      testCase: this,
      itemsCount,
    });

    await renderComponent(this);

    expect(findAll('.fb-table-row')).to.have.length(itemsCount);
  });

  it('renders "Building" state with stats of archive on list', async function () {
    const itemsCount = 1;
    const mockArray = mockItems({
      testCase: this,
      itemsCount,
    });
    const archive = mockArray.array[0];
    const filesArchived = 8;
    const bytesArchived = 2048;
    setProperties(archive, {
      state: 'building',
      stats: {
        filesArchived,
        bytesArchived,
      },
    });

    await renderComponent(this);

    const colStates = findAll('.fb-table-row .fb-table-col-state');
    expect(colStates).to.have.length(1);
    const colState = colStates[0];
    expect(colState.textContent).to.contain('Building');
    expect(colState.textContent).to.contain('8 files');
    expect(colState.textContent).to.contain('2 KiB');
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

      await renderComponent(this);

      const actions = await openFileContextMenu({ name: firstArchiveName });
      const action = actions.querySelector('.file-action-createIncrementalArchive');
      expect(
        action,
        'create incremental archive item'
      ).to.exist;
      await click(action);
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

    await renderComponent(this);

    const actions = await openFileContextMenu({ name: firstArchiveName });
    const recallAction = actions.querySelectorAll('.file-action-recall');
    expect(
      recallAction,
      'recall archive menu item'
    ).to.have.length(1);
    expect(recallAction[0]).exist.to.contain.text('Recall to...');
    await click(recallAction[0]);
    expect(openRecallModal).to.have.been.calledOnce;
    expect(openRecallModal).to.have.been.calledWith(mockArray.array[0]);
  });

  it('has "settings" action for archive item that invokes settings modal on click', async function () {
    const itemsCount = 1;
    const mockArray = mockItems({
      testCase: this,
      itemsCount,
    });
    const archive = mockArray.array[0];
    const firstArchiveName = mockArray.array[0].name;
    const openArchiveDetailsModal = sinon.spy();
    this.set('openArchiveDetailsModal', openArchiveDetailsModal);
    this.set('spacePrivileges', {
      viewArchives: true,
      manageDatasets: true,
      createArchives: true,
    });

    await renderComponent(this);

    const actions = await openFileContextMenu({ name: firstArchiveName });
    const action = actions.querySelector('.file-action-archiveProperties');
    expect(
      action,
      'archive settings item'
    ).to.exist;
    await click(action);
    expect(openArchiveDetailsModal).to.have.been.calledOnce;
    expect(openArchiveDetailsModal).to.have.been.calledWith(archive);
  });

  it('has non-disabled "cancel archivization" action for archive item that invokes cancel confirmation modal on click',
    async function () {
      const itemsCount = 1;
      const mockArray = mockItems({
        testCase: this,
        itemsCount,
      });
      const archive = mockArray.array[0];
      archive.set('state', 'building');
      await archive.save();
      const firstArchiveName = mockArray.array[0].name;
      const openCancelModal = sinon.spy();
      this.set('openCancelModal', openCancelModal);
      this.set('spacePrivileges', {
        viewArchives: true,
        manageDatasets: true,
        createArchives: true,
      });

      await renderComponent(this);

      const actions = await openFileContextMenu({ name: firstArchiveName });
      const actionLi = findByText('Cancel archivization', `#${actions.id} li`);
      expect(actionLi, 'archive menu item').to.exist;
      expect(actionLi).to.not.match('.disabled');
      expect(actionLi).to.match(':last-of-type');
      await click(actionLi.querySelector('a'));
      expect(openCancelModal).to.have.been.calledOnce;
      expect(openCancelModal).to.have.been.calledWith([archive]);
    }
  );

  it('does not have "cancel archivization" action for created archive',
    async function () {
      const itemsCount = 1;
      const mockArray = mockItems({
        testCase: this,
        itemsCount,
      });
      const firstArchiveName = mockArray.array[0].name;
      const openCancelModal = sinon.spy();
      this.set('openCancelModal', openCancelModal);
      this.set('spacePrivileges', {
        viewArchives: true,
        manageDatasets: true,
        createArchives: true,
      });

      await renderComponent(this);

      const actions = await openFileContextMenu({ name: firstArchiveName });
      const actionLi = findByText('Cancel archivization', `#${actions.id} li`);
      expect(actionLi, 'archive menu item').to.not.exist;
    }
  );
});

async function renderComponent(testCase) {
  const {
    refreshInterval,
    openCreateArchiveModal,
    openRecallModal,
    openArchiveDetailsModal,
    openCancelModal,
  } = testCase.getProperties(
    'refreshInterval',
    'openCreateArchiveModal',
    'openRecallModal',
    'openArchiveDetailsModal',
    'openCancelModal',
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
    ownerSource: testCase.owner,
    spaceDatasetsViewState,
    refreshInterval: refreshInterval || 0,
    openCreateArchiveModal: openCreateArchiveModal ||
      notStubbed('openCreateArchiveModal'),
    openRecallModal: openRecallModal ||
      notStubbed('openRecallModal'),
    openArchiveDetailsModal: openArchiveDetailsModal ||
      notStubbed('openArchiveDetailsModal'),
    openCancelModal: openCancelModal ||
      notStubbed('openCancelModal'),
    firstColumnWidth: 20,
    getEnabledColumnsFromLocalStorage() {
      this.set('columns.state.isEnabled', true);
    },
  }));
  setTestPropertyDefault(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  await render(hbs `<div id="content-scroll">{{file-browser
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
}

// TODO: VFS-7643 common test utils for browsers

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
  const store = lookupService(testCase, 'store');
  const archives = _.range(0, itemsCount).map(i => {
    const name = generateItemName(i);
    const entityId = name;
    const archive = store.createRecord('archive', {
      id: generateItemId(entityId),
      name,
      index: name,
      type: 'dir',
      state: 'preserved',
      stats: {
        bytesArchived: 100,
        filesArchived: 10,
      },
    });
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
