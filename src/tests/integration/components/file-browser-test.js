import { expect } from 'chai';
import { describe, it, beforeEach, afterEach, context } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { registerService, lookupService } from '../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
import { get } from '@ember/object';
import Evented from '@ember/object/evented';
import { resolve } from 'rsvp';
import wait from 'ember-test-helpers/wait';
import _ from 'lodash';
import { click } from 'ember-native-dom-helpers';
import $ from 'jquery';
import sleep from 'onedata-gui-common/utils/sleep';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';

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
});

class MockArray {
  constructor(array) {
    if (!array) {
      throw new Error('file-browser-test MockArray: array not specified');
    }
    this.array = array;
  }
  fetch(
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
    return resolve(this.array.slice(startOffset, endOffset));
  }
  async fetchChildren(dirId, scope, index, offset, limit) {
    const fetchResult = await this.fetch(index, offset, limit);
    const result = { childrenRecords: fetchResult, isLast: fetchResult.length < limit };
    return result;
  }
}

describe('Integration | Component | file browser (main component)', function () {
  setupComponentTest('file-browser', {
    integration: true,
  });

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

    await render(this);

    expect(this.$('.fb-table-row')).to.have.length(filesCount);
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

    await render(this);

    let clickCount = numberOfDirs - 2;
    const enterDir = async () => {
      const $row = this.$('.fb-table-row');
      $row.click();
      $row.click();
      await wait();
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
    expect(this.$('.fb-table-row'), 'table rows elements').to.have.length(1);
    await enterDir();
    expect(this.$('.fb-table-row').text()).to.contain('Directory 4');
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
    mockFilesTree(this, {
      f1: {},
    });

    await render(this);

    expect(this.$('.fb-table-row')).to.exist;

    const $actions = await openFileContextMenu({ name: 'f1 name' });

    expect($actions.find('.file-action-createHardlink').parent())
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

    await render(this);

    expect(fetchDirChildren).to.have.been.called;
    await wait();
    expect(this.$('.fb-table-row')).to.have.length(0);
    expect(this.$('.empty-dir')).to.exist;
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

    await render(this);

    expect(fetchDirChildren).to.have.been.called;
    await wait();
    expect(this.$('.fb-table-row')).to.have.class('file-cut');
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

      this.on('updateDirEntityId', function updateDirEntityId(id) {
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

      await render(this);

      expect(fetchDirChildren).to.be.called;
      fetchDirChildren.resetHistory();
      expect(this.$('.file-action-refresh')).to.exist;
      await click('.file-action-refresh');
      expect(fetchDirChildren).to.be.called;
    }
  );

  // NOTE: use "done" callback for async tests because of bug in ember test framework
  describe('selects using injected file ids', function () {
    it('visible file on list', async function (done) {
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

      await render(this);

      expect(fetchDirChildren).to.have.been.calledWith(
        entityId,
        sinon.match.any,
        selectedFile.index,
        sinon.match.any,
        sinon.match.any
      );
      await wait();
      const $fileSelected = this.$('.file-selected');
      expect($fileSelected, 'selected file row').to.have.lengthOf(1);
      expect($fileSelected).to.have.attr('data-row-id', selectedFile.id);
      done();
    });

    it('file that is out of initial list range', async function (done) {
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

      await render(this);

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
      const $fileSelected = this.$('.file-selected');
      expect($fileSelected, 'selected file row').to.exist;
      expect($fileSelected).to.have.attr('data-row-id', selectedFile.id);
      done();
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
      const clock = sinon.useFakeTimers({
        now: Date.now(),
        shouldAdvanceTime: true,
      });
      this.set('clock', clock);
    });

    afterEach(function () {
      this.get('clock').restore();
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
            async function (done) {
              this.set('dir.effQosMembership', effQosMembership);
              this.set('spacePrivileges', { view: true, viewQos: true });
              const openQos = sinon.spy();
              this.set('openQos', openQos);

              await render(this);
              expect(openQos).to.have.not.been.called;

              const $headStatusBar = this.$('.filesystem-table-head-status-bar');
              const $qosTagGroup = $headStatusBar.find('.qos-file-status-tag-group');
              expect($headStatusBar, 'head status bar').to.have.length(1);
              expect($qosTagGroup, 'qos tag').to.have.length(1);
              expect($qosTagGroup.text()).to.contain('QoS');
              if (['ancestor', 'directAndAncestor'].includes(effQosMembership)) {
                const $inheritanceIcon = $qosTagGroup.find('.oneicon-inheritance');
                expect($inheritanceIcon, 'inheritance icon').to.have.length(1);
              }
              await click($qosTagGroup.find('.file-status-qos')[0]);
              expect(openQos).to.have.been.calledOnce;
              expect(openQos).to.have.been.calledWith([this.get('dir')]);
              done();
            }
          );
        });

        it('does not display qos tag in table header if current dir has none qos membership',
          async function (done) {
            this.set('dir.effQosMembership', 'none');

            await render(this);

            const $headStatusBar = this.$('.filesystem-table-head-status-bar');
            const $qosTag = $headStatusBar.find('.file-status-qos');
            expect($headStatusBar, 'head status bar').to.have.length(1);
            expect($qosTag, 'qos tag').to.not.exist;
            done();
          }
        );

        it('displays functional dataset tag in table header if current dir has direct dataset',
          async function (done) {
            this.set('dir.effDatasetMembership', 'direct');
            const openDatasets = sinon.spy();
            this.set('openDatasets', openDatasets);

            await render(this);
            expect(openDatasets).to.have.not.been.called;

            const $headStatusBar = this.$('.filesystem-table-head-status-bar');
            const $datasetTag = $headStatusBar.find('.file-status-dataset');
            expect($headStatusBar, 'head status bar').to.have.length(1);
            expect($datasetTag, 'dataset tag').to.have.length(1);
            expect($datasetTag.text()).to.contain('Dataset');
            await click($datasetTag[0]);
            expect(openDatasets).to.have.been.calledOnce;
            done();
          }
        );

        it('does not display functional dataset tag in table header if current dir has "none" dataset membership',
          async function (done) {
            this.set('dir.effDatasetMembership', 'none');
            const openDatasets = sinon.spy();
            this.set('openDatasets', openDatasets);

            await render(this);
            expect(openDatasets).to.have.not.been.called;

            const $headStatusBar = this.$('.filesystem-table-head-status-bar');
            const $datasetTag = $headStatusBar.find('.file-status-dataset');
            expect($headStatusBar, 'head status bar').to.have.length(1);
            expect($datasetTag, 'dataset tag').to.not.exist;
            done();
          }
        );

        it('has enabled datasets item in context menu', async function (done) {
          await render(this);
          const $menu = await openFileContextMenu({ entityId: 'i1' });
          expect(
            $menu.find('li:not(.disabled) .file-action-datasets'),
            'non-disabled datasets action'
          ).to.exist;

          done();
        });

        testOpenDatasetsModal('dataset tag is clicked', async function () {
          const $row = getFileRow({ entityId: 'i1' });
          const $datasetTag = $row.find('.file-status-dataset');
          expect($datasetTag, 'dataset tag').to.have.length(1);
          await click($datasetTag[0]);
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

        it('has disabled datasets item in context menu', async function (done) {
          await render(this);
          const $menu = await openFileContextMenu({ entityId: 'i1' });
          expect($menu.find('li.disabled .file-action-datasets')).to.exist;

          done();
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

function mockFilesTree(testCase, treeSpec) {
  const fileManager = lookupService(testCase, 'fileManager');
  const fetchDirChildrenStub = sinon.stub(fileManager, 'fetchDirChildren');

  const root = {
    entityId: 'root',
    name: 'root name',
    index: 'root name',
    type: 'dir',
    hasParent: false,
    parent: resolve(null),
  };
  root.effFile = root;
  const elementsMap = {
    root,
  };

  const treeElementGeneratorQueue = [{ parent: root, subtreeSpec: treeSpec }];
  while (treeElementGeneratorQueue.length) {
    const {
      parent,
      subtreeSpec,
    } = treeElementGeneratorQueue.shift();
    const subtreeElements = Object.keys(subtreeSpec).map(subElementId => {
      const isDir = subtreeSpec[subElementId] !== null;
      const element = {
        entityId: subElementId,
        name: `${subElementId} name`,
        index: `${subElementId} name`,
        type: isDir ? 'dir' : 'file',
        hasParent: true,
        parent: resolve(parent),
      };
      element.effFile = element;
      elementsMap[subElementId] = element;
      if (isDir) {
        treeElementGeneratorQueue.push({
          parent: element,
          subtreeSpec: subtreeSpec[subElementId],
        });
      }
      return element;
    });
    fetchDirChildrenStub.withArgs(
      parent.entityId,
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
  it(`invokes datasets modal opening when ${openDescription}`, async function (done) {
    const openDatasets = sinon.spy();
    this.set('openDatasets', openDatasets);
    this.set('item1.effDatasetMembership', 'direct');

    await render(this);

    expect(openDatasets).to.have.not.been.called;
    await openFunction.call(this);
    expect(openDatasets).to.have.been.calledOnce;
    expect(openDatasets).to.have.been.calledWith(
      sinon.match((selected) => {
        return selected && selected.length === 1 &&
          selected[0] === this.get('item1');
      })
    );

    done();
  });
}

function testDownloadFromContextMenu() {
  const description =
    'shows spinner and starts download after using download context menu item';
  it(description, async function (done) {
    const btnId = this.get('item1.type') === 'dir' ? 'downloadTar' : 'download';
    testDownload(
      this,
      done,
      (fileId) => chooseFileContextMenuAction({ entityId: fileId }, btnId)
    );
  });
}

function testDownloadUsingDoubleClick() {
  it('shows spinner and starts download after double click', async function (done) {
    testDownload(this, done, (fileId) => doubleClickFile({ entityId: fileId }));
  });
}

async function testDownload(testCase, done, invokeDownloadFunction) {
  const {
    fileId,
    getFileDownloadUrl,
    sleeper,
  } = prepareDownload(testCase);

  await render(testCase);
  const $row = getFileRow({ entityId: fileId });

  expect($row.find('.on-icon-loading-spinner'), 'spinner').to.not.exist;
  await invokeDownloadFunction(fileId);
  expect($row.find('.on-icon-loading-spinner'), 'spinner').to.exist;
  expect(getFileDownloadUrl).to.be.calledOnce;
  expect(getFileDownloadUrl).to.be.calledWith([fileId]);
  testCase.get('clock').tick(1000);
  await sleeper;
  await wait();
  expect($row.find('.on-icon-loading-spinner'), 'spinner').to.not.exist;

  done();
}

function itHasWorkingClipboardFunction({
  description,
  setupStubs,
  contextMenuActionId,
  expectedToolbarActionId,
  finalExpect,
}) {
  it(description, async function (done) {
    mockFilesTree(this, {
      f1: null,
      f2: {
        f3: null,
      },
    });
    setupStubs(this);

    this.set('spaceId', 'myspaceid');

    await render(this);

    expect(this.$('.fb-table-row')).to.exist;

    await chooseFileContextMenuAction({ name: 'f1 name' }, contextMenuActionId);

    expect($(`.file-action-${expectedToolbarActionId}`)).to.exist;

    await doubleClickFile({ name: 'f2 name' });
    await click(`.file-action-${expectedToolbarActionId}`);

    finalExpect(this);
    done();
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

function getFileRow({ entityId, name }) {
  let $row;
  if (entityId) {
    $row = $(`.fb-table-row[data-row-id=${entityId}]`);
  } else {
    $row = $(`.fb-table-row:contains("${name}")`);
  }
  expect($row).to.have.length(1);
  return $row;
}

async function doubleClickFile(file) {
  const row = getFileRow(file)[0];
  click(row);
  await sleep(1);
  await click(row);
}

async function openFileContextMenu(file) {
  const $row = getFileRow(file);
  $row[0].dispatchEvent(new Event('contextmenu'));
  await wait();
  const $fileActions = $('.file-actions');
  expect($fileActions, 'file-actions').to.have.length(1);
  return $fileActions;
}

async function chooseFileContextMenuAction(file, actionId) {
  const $fileActions = await openFileContextMenu(file);
  const action = $fileActions.find(`.file-action-${actionId}`)[0];
  expect(action, `action item ${actionId}`).to.exist;
  await click(action);
}

async function render(testCase) {
  const {
    openCreateNewDirectory,
    openDatasets,
    openQos,
  } = testCase.getProperties('openCreateNewDirectory', 'openDatasets', 'openQos');
  setDefaultTestProperty(testCase, 'spacePrivileges', {});
  setDefaultTestProperty(testCase, 'spaceId', 'some_space_id');
  setDefaultTestProperty(testCase, 'browserModel', FilesystemBrowserModel.create({
    ownerSource: testCase,
    openCreateNewDirectory: openCreateNewDirectory ||
      notStubbed('openCreateNewDirectory'),
    openDatasets: openDatasets || notStubbed('openDatasets'),
    openQos: openQos || notStubbed('openQos'),
  }));
  setDefaultTestProperty(testCase, 'updateDirEntityId', notStubbed('updateDirEntityId'));
  testCase.render(hbs `<div id="content-scroll">{{file-browser
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
    changeSelectedItems=(action (mut selectedItems))
  }}</div>`);
  await wait();
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

function generateFileId(entityId) {
  return `file.${entityId}.instance:private`;
}

function mockRootFiles({ testCase, filesCount }) {
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
  fileManager.fetchDirChildren = (...args) => mockArray.fetchChildren(...args);
  return mockArray;
}
