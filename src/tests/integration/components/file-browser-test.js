import { expect } from 'chai';
import { describe, it, beforeEach, afterEach, context } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, findAll, find, doubleClick, click, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { registerService, lookupService } from '../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
import { get } from '@ember/object';
import Evented from '@ember/object/evented';
import { resolve } from 'rsvp';
import _ from 'lodash';
import sleep from 'onedata-gui-common/utils/sleep';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { mockRootFiles } from '../../helpers/files';
import { once } from '@ember/runloop';
import {
  getFileRow,
  doubleClickFile,
  chooseFileContextMenuAction,
  openFileContextMenu,
} from '../../helpers/item-browser';

const UploadManager = Service.extend({
  assignUploadDrop() {},
  assignUploadBrowse() {},
  changeTargetDirectory() {},
});

const FileManager = Service.extend(Evented, {
  fetchDirChildren() {},
  copyOrMoveFile() {},
  createSymlink() {},
  createHardlink() {},
  registerRefreshHandler() {},
  deregisterRefreshHandler() {},
  refreshDirChildren() {},
  getFileDownloadUrl() {},
  async getFileOwner() {},
});

describe('Integration | Component | file browser (main component)', function () {
  setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'uploadManager', UploadManager);
    registerService(this, 'fileManager', FileManager);
  });

  it('renders files on list', async function () {
    const entityId = 'deid';
    const name = 'Test directory';
    const filesCount = 3;
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
    };
    this.set('dir', dir);
    mockRootFiles({
      testCase: this,
      filesCount,
    });

    await renderComponent(this);

    expect(findAll('.fb-table-row')).to.have.length(filesCount);
  });

  it('changes directories on double click', async function () {
    const numberOfDirs = 5;
    const fileScope = 'private';

    const rootDir = {
      entityId: 'root',
      name: 'Some Space',
      index: 'Some Space',
      type: 'dir',
      parent: resolve(null),
      hasParent: false,
    };

    const dirs = _.range(0, numberOfDirs).map(i => ({
      entityId: `file-${i}`,
      name: `Directory ${i}`,
      index: `Directory ${i}`,
      type: 'dir',
    }));

    for (let i = 0; i < numberOfDirs; ++i) {
      dirs[i].parent = resolve(i > 0 ? dirs[i - 1] : rootDir);
      dirs[i].hasParent = true;
      dirs[i].effFile = dirs[i];
    }

    this.setProperties({
      dir: rootDir,
      selectedItems: [],
    });
    this.set('updateDirEntityId', (id) => {
      this.set('dir', dirs.findBy('entityId', id));
    });
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');

    for (let i = -1; i < numberOfDirs; ++i) {
      fetchDirChildren.withArgs(
        i === -1 ? 'root' : `file-${i}`,
        fileScope,
        null,
        sinon.match.any,
        sinon.match.any
      ).resolves({
        isLast: true,
        childrenRecords: i === numberOfDirs - 1 ? [] : [dirs[i + 1]],
      });
    }
    fetchDirChildren.resolves({ isLast: true, childrenRecords: [] });

    await renderComponent(this);

    let clickCount = numberOfDirs - 2;
    const enterDir = async () => {
      await doubleClick('.fb-table-row');
      if (clickCount > 0) {
        clickCount = clickCount - 1;
        return enterDir();
      }
    };

    expect(fetchDirChildren).to.have.been.calledWith(
      'root',
      fileScope,
      null,
      sinon.match.any,
      sinon.match.any
    );
    fetchDirChildren.resetHistory();
    expect(findAll('.fb-table-row'), 'table rows elements').to.have.length(1);
    await enterDir();
    expect(find('.fb-table-row')).to.contain.text('Directory 4');
  });

  itHasWorkingClipboardFunction({
    description: 'shows working paste button when invoked file copy from context menu',
    setupStubs: testCase => {
      testCase.set(
        'actionSpy',
        sinon.spy(lookupService(testCase, 'fileManager'), 'copyOrMoveFile')
      );
    },
    contextMenuActionId: 'copy',
    expectedToolbarActionId: 'paste',
    finalExpect: testCase => expect(testCase.get('actionSpy'))
      .to.have.been.calledWith(testCase.get('elementsMap.f1'), 'f2', 'copy'),
  });

  itHasWorkingClipboardFunction({
    description: 'shows working symlink button when invoked file symlink from context menu',
    setupStubs: testCase => {
      testCase.set(
        'actionSpy',
        sinon.stub(lookupService(testCase, 'fileManager'), 'createSymlink').resolves()
      );
    },
    contextMenuActionId: 'createSymlink',
    expectedToolbarActionId: 'placeSymlink',
    finalExpect: testCase => expect(testCase.get('actionSpy')).to.have.been.calledWith(
      'f1 name',
      testCase.get('elementsMap.f2'),
      '/root name/f1 name',
      'myspaceid'
    ),
  });

  itHasWorkingClipboardFunction({
    description: 'shows working hardlink button when invoked file hardlink from context menu',
    setupStubs: testCase => {
      testCase.set(
        'actionSpy',
        sinon.stub(lookupService(testCase, 'fileManager'), 'createHardlink').resolves()
      );
    },
    contextMenuActionId: 'createHardlink',
    expectedToolbarActionId: 'placeHardlink',
    finalExpect: testCase => expect(testCase.get('actionSpy')).to.have.been.calledWith(
      'f1 name',
      testCase.get('elementsMap.f2'),
      testCase.get('elementsMap.f1')
    ),
  });

  it('has blocked hardlink creation for directories', async function () {
    await mockFilesTree(this, {
      f1: {},
    });

    await renderComponent(this);

    expect(find('.fb-table-row')).to.exist;

    const actions = await openFileContextMenu({ name: 'f1 name' });

    expect(actions.querySelector('.file-action-createHardlink').parentElement)
      .to.have.class('disabled');
  });

  it('shows empty dir message with working new directory button', async function () {
    const entityId = 'deid';
    const name = 'Test directory';
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
    };
    const files = [];
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren')
      .resolves({ childrenRecords: files, isLast: true });
    const openCreateNewDirectory = sinon.spy();

    this.setProperties({
      openCreateNewDirectory,
      dir,
      selectedItems: [],
    });

    await renderComponent(this);

    expect(fetchDirChildren).to.have.been.called;
    expect(find('.fb-table-row')).to.not.exist;
    expect(find('.empty-dir')).to.exist;
    await click('.empty-dir-new-directory-action');
    expect(openCreateNewDirectory).to.have.been.calledOnce;
    expect(openCreateNewDirectory).to.have.been.calledWith(dir);
  });

  it('adds file-cut class if file is in clipboard in move mode', async function () {
    const entityId = 'deid';
    const name = 'Test directory';
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
    };
    const f1 = {
      entityId: 'f1',
      name: 'File 1',
      index: 'File 1',
    };
    const files = [f1];
    this.set('dir', dir);
    this.setProperties({
      dir,
      fileClipboardMode: 'move',
      fileClipboardFiles: [f1],
    });
    const fileManager = lookupService(this, 'fileManager');
    const i18n = lookupService(this, 'i18n');

    const i18nt = sinon.stub(i18n, 't');
    i18nt.calledWith(
      'errors.backendErrors.posix',
      sinon.match.any,
    );

    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren')
      .resolves({ childrenRecords: files, isLast: true });

    await renderComponent(this);

    expect(fetchDirChildren).to.have.been.called;
    expect(find('.fb-table-row')).to.have.class('file-cut');
  });

  it('shows refresh button which invokes refresh file list API action',
    async function () {
      const dir = {
        entityId: 'root',
        name: 'Test directory',
        index: 'Test directory',
        type: 'dir',
        hasParent: false,
        parent: resolve(null),
      };

      const dirs = [dir];

      this.set('updateDirEntityId', function updateDirEntityId(id) {
        this.set('dir', dirs.findBy('entityId', id));
      });

      this.setProperties({
        dir,
        selectedItems: [],
      });

      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');
      fetchDirChildren.resolves({
        childrenRecords: [{
          entityId: 'file1',
          name: 'File one',
        }],
        isLast: true,
      });

      await renderComponent(this);

      expect(fetchDirChildren, 'after init').to.be.called;
      fetchDirChildren.resetHistory();
      expect(find('.file-action-refresh')).to.exist;
      await click('.file-action-refresh');
      // wait for animation - if fail, check what is animation time of fbTableApi.refresh
      await sleep(301);
      expect(fetchDirChildren, 'after refresh').to.be.called;
    }
  );

  testOpenFileInfo({
    openDescription: 'metadata context menu item is clicked',
    tabName: 'metadata',
    async openFunction() {
      await chooseFileContextMenuAction({ entityId: 'i1' }, 'metadata');
    },
  });

  testOpenFileInfo({
    openDescription: 'permissions context menu item is clicked',
    tabName: 'permissions',
    async openFunction() {
      await chooseFileContextMenuAction({ entityId: 'i1' }, 'permissions');
    },
  });

  // NOTE: use "done" callback for async tests because of bug in ember test framework
  describe('selects using injected file ids', function () {
    it('visible file on list', async function () {
      const entityId = 'deid';
      const name = 'Test directory';
      const dir = {
        entityId,
        name,
        type: 'dir',
        parent: resolve(null),
      };
      const files = _.range(4).map(i => {
        const id = `f${i}`;
        const name = `File ${i}`;
        return {
          id,
          entityId: id,
          name,
          index: name,
        };
      });
      const selectedFile = files[1];
      const selectedItemsForJump = [selectedFile];
      this.setProperties({
        dir,
        selectedItemsForJump,
      });
      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');

      fetchDirChildren.withArgs(
        entityId,
        sinon.match.any,
        selectedFile.index,
        sinon.match.any,
        sinon.match.any
      ).resolves({ childrenRecords: [...files], isLast: true });

      // default
      fetchDirChildren.resolves({ childrenRecords: [], isLast: true });

      await renderComponent(this);

      expect(fetchDirChildren).to.have.been.calledWith(
        entityId,
        sinon.match.any,
        selectedFile.index,
        sinon.match.any,
        sinon.match.any
      );
      const fileSelected = findAll('.file-selected');
      expect(fileSelected, 'selected file row').to.have.lengthOf(1);
      expect(fileSelected[0]).to.have.attr('data-row-id', selectedFile.id);
    });

    it('file that is out of initial list range', async function () {
      const entityId = 'deid';
      const name = 'Test directory';
      const dir = {
        entityId,
        name,
        type: 'dir',
        parent: resolve(null),
      };
      const files = _.range(61).map(i => {
        const id = `f${i}`;
        const name = `File ${i}`;
        return {
          id,
          entityId: id,
          name,
          index: name,
        };
      });
      const selectedFile = files[60];
      const selectedItemsForJump = [selectedFile];
      this.setProperties({
        dir,
        selectedItemsForJump,
      });
      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');
      fetchDirChildren.withArgs(
        entityId, // dirId
        sinon.match.any, // scope
        selectedFile.index, // index
        sinon.match.any, // limit
        sinon.match.any // offset
      ).resolves({ childrenRecords: [...files], isLast: true });
      fetchDirChildren.withArgs(
        entityId,
        sinon.match.any,
        files[60].index,
        70,
        -10
      ).resolves({ childrenRecords: files.slice(50, 120), isLast: true });
      // default
      fetchDirChildren.resolves({ childrenRecords: [], isLast: true });

      await renderComponent(this);

      expect(fetchDirChildren).to.have.been.calledWith(
        entityId,
        sinon.match.any,
        selectedFile.index,
        sinon.match.any,
        sinon.match.any
      );
      expect(fetchDirChildren).to.have.been.calledWith(
        entityId,
        sinon.match.any,
        files[60].index,
        sinon.match.any,
        sinon.match.any
      );
      const fileSelected = find('.file-selected');
      expect(fileSelected, 'selected file row').to.exist;
      expect(fileSelected).to.have.attr('data-row-id', selectedFile.id);
    });
  });

  context('with one item in root directory', function () {
    beforeEach(function () {
      const dir = {
        entityId: 'root',
        name: 'Test directory',
        index: 'Test directory',
        type: 'dir',
        hasParent: false,
        parent: resolve(null),
      };
      dir.effFile = dir;

      const item1 = {
        entityId: 'i1',
        name: 'A1',
        index: 'A1',
        hasParent: true,
        parent: resolve(dir),
      };
      item1.effFile = item1;

      this.setProperties({ dir, item1, selectedItems: [] });
      stubSimpleFetch(this, dir, [item1]);
    });

    afterEach(function () {
      destroyFakeClock(this);
    });

    context('when the only item is a file', function () {
      beforeEach(function () {
        this.set('item1.type', 'file');
      });

      context('with space view privileges', function () {
        beforeEach(function () {
          this.set('spacePrivileges', { view: true });
        });

        ['ancestor', 'direct', 'directAndAncestor'].forEach(effQosMembership => {
          it(`displays functional qos tag in table header if current dir has "${effQosMembership}" qos`,
            async function () {
              this.set('dir.effQosMembership', effQosMembership);
              this.set('spacePrivileges', { view: true, viewQos: true });
              const openInfo = sinon.spy();
              this.set('openInfo', openInfo);

              await renderComponent(this);
              expect(openInfo).to.have.not.been.called;

              const headStatusBar = findAll('.filesystem-table-head-status-bar');
              const qosTagGroup = headStatusBar[0]
                .querySelectorAll('.qos-file-status-tag-group');
              expect(headStatusBar, 'head status bar').to.have.length(1);
              expect(qosTagGroup, 'qos tag').to.have.length(1);
              expect(qosTagGroup[0]).to.contain.text('QoS');
              if (['ancestor', 'directAndAncestor'].includes(effQosMembership)) {
                const inheritanceIcon = qosTagGroup[0].querySelectorAll(
                  '.oneicon-inheritance'
                );
                expect(inheritanceIcon, 'inheritance icon').to.have.length(1);
              }
              await click(qosTagGroup[0].querySelector('.file-status-qos'));
              await settled();
              expect(openInfo).to.have.been.calledOnce;
              expect(openInfo).to.have.been.calledWith([this.get('dir')], 'qos');
            }
          );
        });

        it('does not display qos tag in table header if current dir has none qos membership',
          async function () {
            this.set('dir.effQosMembership', 'none');

            await renderComponent(this);

            const headStatusBar = findAll('.filesystem-table-head-status-bar');
            const qosTag = headStatusBar[0].querySelector('.file-status-qos');
            expect(headStatusBar, 'head status bar').to.have.length(1);
            expect(qosTag, 'qos tag').to.not.exist;
          }
        );

        it('displays functional dataset tag in table header if current dir has direct dataset',
          async function () {
            this.set('dir.effDatasetMembership', 'direct');
            const openDatasets = sinon.spy();
            this.set('openDatasets', openDatasets);

            await renderComponent(this);
            expect(openDatasets).to.have.not.been.called;

            const headStatusBar = findAll('.filesystem-table-head-status-bar');
            const datasetTag = headStatusBar[0].querySelectorAll('.file-status-dataset');
            expect(headStatusBar, 'head status bar').to.have.length(1);
            expect(datasetTag, 'dataset tag').to.have.length(1);
            expect(datasetTag[0]).to.contain.text('Dataset');
            await click(datasetTag[0]);
            await settled();
            expect(openDatasets).to.have.been.calledOnce;
          }
        );

        it('does not display functional dataset tag in table header if current dir has "none" dataset membership',
          async function () {
            this.set('dir.effDatasetMembership', 'none');
            const openDatasets = sinon.spy();
            this.set('openDatasets', openDatasets);

            await renderComponent(this);
            expect(openDatasets).to.have.not.been.called;

            const headStatusBar = findAll('.filesystem-table-head-status-bar');
            const datasetTag = headStatusBar[0].querySelector('.file-status-dataset');
            expect(headStatusBar, 'head status bar').to.have.length(1);
            expect(datasetTag, 'dataset tag').to.not.exist;
          }
        );

        it('has enabled datasets item in context menu', async function () {
          await renderComponent(this);
          const menu = await openFileContextMenu({ entityId: 'i1' });
          expect(
            menu.querySelector('li:not(.disabled) .file-action-datasets'),
            'non-disabled datasets action'
          ).to.exist;
        });

        testOpenDatasetsModal('dataset tag is clicked', async function () {
          const row = getFileRow({ entityId: 'i1' });
          const datasetTag = row.querySelectorAll('.file-status-dataset');
          expect(datasetTag, 'dataset tag').to.have.length(1);
          await click(datasetTag[0]);
        });

        testOpenDatasetsModal('dataset context menu item is clicked', async function () {
          await chooseFileContextMenuAction({ entityId: 'i1' }, 'datasets');
        });

        testDownloadFromContextMenu();
        testDownloadUsingDoubleClick();
      });

      context('without space view privileges', function () {
        beforeEach(function () {
          this.set('spacePrivileges', { view: false });
        });

        it('has disabled datasets item in context menu', async function () {
          await renderComponent(this);
          const menu = await openFileContextMenu({ entityId: 'i1' });
          expect(menu.querySelector('li.disabled .file-action-datasets')).to.exist;
        });
      });
    });

    context('when the only item is a directory', function () {
      beforeEach(function () {
        this.set('item1.type', 'dir');
      });

      context('with space view privileges', function () {
        beforeEach(function () {
          this.set('spacePrivileges', { view: true });
        });

        testDownloadFromContextMenu();
      });
    });
  });
});

async function mockFilesTree(testCase, treeSpec) {
  const fileManager = lookupService(testCase, 'fileManager');
  const fetchDirChildrenStub = sinon.stub(fileManager, 'fetchDirChildren');

  const root = await createFile(testCase, {
    entityId: 'root',
    name: 'root name',
    index: 'abc123',
    type: 'dir',
    parent: null,
  });
  const elementsMap = {
    root,
  };

  const treeElementGeneratorQueue = [{ parent: root, subtreeSpec: treeSpec }];
  while (treeElementGeneratorQueue.length) {
    const {
      parent,
      subtreeSpec,
    } = treeElementGeneratorQueue.shift();
    const subtreeElements = [];
    for (const subElementId of Object.keys(subtreeSpec)) {
      const isDir = subtreeSpec[subElementId] !== null;
      const element = await createFile(testCase, {
        entityId: subElementId,
        name: `${subElementId} name`,
        index: `abc-${subElementId}`,
        type: isDir ? 'dir' : 'file',
        parent,
      });
      elementsMap[subElementId] = element;
      if (isDir) {
        treeElementGeneratorQueue.push({
          parent: element,
          subtreeSpec: subtreeSpec[subElementId],
        });
      }
      subtreeElements.push(element);
    }
    fetchDirChildrenStub.withArgs(
      get(parent, 'entityId'),
      sinon.match.any,
      null,
      sinon.match.any,
      0,
      sinon.match.any
    ).resolves({ childrenRecords: subtreeElements, isLast: true });
  }

  fetchDirChildrenStub.resolves({ childrenRecords: [], isLast: true });

  testCase.setProperties({
    elementsMap,
    fetchDirChildrenStub,
    updateDirEntityId: id => testCase.set('dir', elementsMap[id]),
    dir: root,
    selectedItems: [],
  });
}

function testOpenDatasetsModal(openDescription, openFunction) {
  it(`invokes datasets modal opening when ${openDescription}`, async function () {
    const openDatasets = sinon.spy();
    this.set('openDatasets', openDatasets);
    this.set('item1.effDatasetMembership', 'direct');

    await renderComponent(this);

    expect(openDatasets).to.have.not.been.called;
    await openFunction.call(this);
    expect(openDatasets).to.have.been.calledOnce;
    expect(openDatasets).to.have.been.calledWith(
      sinon.match((selected) => {
        return selected && selected.length === 1 &&
          selected[0] === this.get('item1');
      })
    );
  });
}

function testOpenFileInfo({ openDescription, tabName, openFunction }) {
  it(`invokes info modal opening with tab "${tabName}" when ${openDescription}`, async function () {
    whenRootDirectoryHasOneItem(this);
    whenHaveSpaceViewPrivileges(this);

    const openInfo = sinon.spy();
    this.set('openInfo', openInfo);

    await renderComponent(this);

    expect(openInfo).to.have.not.been.called;
    await openFunction.call(this);
    expect(openInfo).to.have.been.calledOnce;
    expect(openInfo).to.have.been.calledWith(
      [this.item1],
      tabName,
    );
  });
}

function testDownloadFromContextMenu() {
  const description =
    'shows spinner and starts download after using download context menu item';
  it(description, async function () {
    const btnId = this.get('item1.type') === 'dir' ? 'downloadTar' : 'download';
    await testDownload(
      this,
      (fileId) => chooseFileContextMenuAction({ entityId: fileId }, btnId)
    );
  });
}

function testDownloadUsingDoubleClick() {
  it('shows spinner and starts download after double click', async function () {
    await testDownload(this, (fileId) => doubleClickFile({ entityId: fileId }));
  });
}

async function testDownload(testCase, invokeDownloadFunction) {
  const clock = useFakeClock(testCase);
  const {
    fileId,
    getFileDownloadUrl,
    sleeper,
  } = prepareDownload(testCase);

  await renderComponent(testCase);
  const row = getFileRow({ entityId: fileId });

  expect(row.querySelector('.on-icon-loading-spinner'), 'spinner').to.not.exist;
  await invokeDownloadFunction(fileId);
  expect(row.querySelector('.on-icon-loading-spinner'), 'spinner').to.exist;
  expect(getFileDownloadUrl).to.be.calledOnce;
  expect(getFileDownloadUrl).to.be.calledWith([fileId]);
  clock.tick(1000);
  await sleeper;
  await settled();
  expect(row.querySelector('.on-icon-loading-spinner'), 'spinner').to.not.exist;
}

function itHasWorkingClipboardFunction({
  description,
  setupStubs,
  contextMenuActionId,
  expectedToolbarActionId,
  finalExpect,
}) {
  it(description, async function () {
    await mockFilesTree(this, {
      f1: null,
      f2: {
        f3: null,
      },
    });
    setupStubs(this);

    this.set('spaceId', 'myspaceid');

    await renderComponent(this);

    expect(find('.fb-table-row'), 'file row').to.exist;

    await chooseFileContextMenuAction({ name: 'f1 name' }, contextMenuActionId);

    expect(document.querySelector(`.file-action-${expectedToolbarActionId}`)).to.exist;

    await doubleClickFile({ name: 'f2 name' });
    await click(`.file-action-${expectedToolbarActionId}`);

    finalExpect(this);
  });
}

function prepareDownload(testCase) {
  const fileId = testCase.get('item1.entityId');
  const fileManager = lookupService(testCase, 'fileManager');
  const sleeper = sleep(500).then(() => ({
    fileUrl: 'http://localhost/test.tar.gz',
  }));
  const getFileDownloadUrl = sinon.stub(fileManager, 'getFileDownloadUrl')
    .resolves(sleeper);
  const handleFileDownloadUrl = sinon.stub();
  testCase.set('handleFileDownloadUrl', handleFileDownloadUrl);
  return { fileId, getFileDownloadUrl, handleFileDownloadUrl, sleeper };
}

function stubSimpleFetch(testCase, dir, childrenRecords) {
  const fileManager = lookupService(testCase, 'fileManager');
  const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');
  fetchDirChildren.withArgs(
    get(dir, 'entityId'),
    sinon.match.any,
    null,
    sinon.match.any,
    0
  ).resolves({ childrenRecords, isLast: true });
  fetchDirChildren.resolves({ childrenRecords: [], isLast: true });
  return fetchDirChildren;
}

async function renderComponent(testCase) {
  const {
    openCreateNewDirectory,
    openInfo,
    openDatasets,
  } = testCase.getProperties(
    'openCreateNewDirectory',
    'openInfo',
    'openDatasets',
  );
  setDefaultTestProperty(testCase, 'spacePrivileges', {});
  setDefaultTestProperty(testCase, 'spaceId', 'some_space_id');
  setDefaultTestProperty(testCase, 'browserModel', FilesystemBrowserModel.create({
    ownerSource: testCase.owner,
    openCreateNewDirectory: openCreateNewDirectory ||
      notStubbed('openCreateNewDirectory'),
    openDatasets: openDatasets || notStubbed('openDatasets'),
    openInfo: openInfo || notStubbed('openInfo'),
  }));
  setDefaultTestProperty(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  testCase.set('changeSelectedItemsImmediately', function (selectedItems) {
    this.set('selectedItems', selectedItems);
  });
  testCase.set('changeSelectedItems', async function (selectedItems) {
    once(this, 'changeSelectedItemsImmediately', selectedItems);
    await sleep(0);
  });
  await render(hbs `<div id="content-scroll">{{file-browser
    browserModel=browserModel
    dir=dir
    spaceId=spaceId
    selectedItems=selectedItems
    selectedItemsForJump=selectedItemsForJump
    fileClipboardMode=fileClipboardMode
    fileClipboardFiles=fileClipboardFiles
    spacePrivileges=spacePrivileges
    handleFileDownloadUrl=handleFileDownloadUrl
    updateDirEntityId=(action updateDirEntityId)
    changeSelectedItems=(action changeSelectedItems)
  }}</div>`);
}

function setDefaultTestProperty(testCase, propertyName, defaultValue) {
  if (testCase.get(propertyName) === undefined) {
    testCase.set(propertyName, defaultValue);
  }
}

function notStubbed(stubName) {
  return () => {
    throw new Error(`${stubName} is not stubbed`);
  };
}

async function createFile(testCase, data) {
  if (data.entityId) {
    data.id = `file.${data.entityId}.instance:private`;
    delete data.entityId;
  }
  return await lookupService(testCase, 'store').createRecord('file', data).save();
}

function useFakeClock(testCase) {
  const clock = sinon.useFakeTimers({
    now: Date.now(),
    shouldAdvanceTime: true,
  });
  testCase.clock = clock;
  return clock;
}

function destroyFakeClock(testCase) {
  if (testCase.clock) {
    testCase.clock.restore();
  }
}

function whenRootDirectoryHasOneItem(testCase, { itemType = 'file' } = {}) {
  const dir = {
    entityId: 'root',
    name: 'Test directory',
    index: 'Test directory',
    type: 'dir',
    hasParent: false,
    parent: resolve(null),
  };
  dir.effFile = dir;

  const item1 = {
    entityId: 'i1',
    name: 'A1',
    index: 'A1',
    hasParent: true,
    type: itemType,
    parent: resolve(dir),
  };
  item1.effFile = item1;

  testCase.setProperties({ dir, item1, selectedItems: [] });
  stubSimpleFetch(testCase, dir, [item1]);
}

function whenHaveSpaceViewPrivileges(testCase) {
  testCase.set('spacePrivileges', { view: true });
}
