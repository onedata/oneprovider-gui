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
import { click, triggerEvent } from 'ember-native-dom-helpers';
import $ from 'jquery';
import sleep from 'onedata-gui-common/utils/sleep';

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

const I18n = Service.extend({
  t: () => '',
});

describe('Integration | Component | file browser (main component)', function () {
  setupComponentTest('file-browser', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'uploadManager', UploadManager);
    registerService(this, 'fileManager', FileManager);
    registerService(this, 'i18n', I18n);
  });

  it('renders files on list', function () {
    const entityId = 'deid';
    const name = 'Test directory';
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
    };
    const files = [{
        id: 'f1',
        entityId: 'f1',
        name: 'File 1',
        index: 'File 1',
      },
      {
        id: 'f2',
        entityId: 'f2',
        name: 'File 2',
        index: 'File 2',
      },
      {
        id: 'f3',
        entityId: 'f3',
        name: 'File 3',
        index: 'File 3',
      },
    ];
    this.set('dir', dir);
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');

    fetchDirChildren.withArgs(
      entityId,
      sinon.match.any,
      null,
      sinon.match.any,
      sinon.match.any
    ).resolves({ childrenRecords: files, isLast: true });
    fetchDirChildren.resolves({ childrenRecords: [], isLast: true });

    this.render(hbs `<div id="content-scroll">{{file-browser dir=dir}}</div>`);

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.called;
      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.have.length(3);
      });
    });
  });

  it('changes directories on double click', function () {
    const numberOfDirs = 5;

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
    }

    this.setProperties({
      dir: rootDir,
      selectedFiles: Object.freeze([]),
    });
    this.on('updateDirEntityId', function updateDirEntityId(id) {
      this.set('dir', dirs.findBy('entityId', id));
    });
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');

    for (let i = -1; i < numberOfDirs; ++i) {
      fetchDirChildren.withArgs(
        i === -1 ? 'root' : `file-${i}`,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      ).resolves({
        isLast: true,
        childrenRecords: i === numberOfDirs - 1 ? [] : [dirs[i + 1]],
      });
    }
    fetchDirChildren.resolves({ isLast: true, childrenRecords: [] });

    this.render(hbs `<div id="content-scroll">{{file-browser
      dir=dir
      selectedFiles=selectedFiles
      updateDirEntityId=(action "updateDirEntityId")
      changeSelectedFiles=(action (mut selectedFiles))
    }}</div>`);

    let clickCount = numberOfDirs - 2;
    const enterDir = () => {
      const $row = this.$('.fb-table-row');
      $row.click();
      $row.click();
      return wait().then(() => {
        if (clickCount > 0) {
          clickCount = clickCount - 1;
          return enterDir();
        } else {
          resolve();
        }
      });
    };

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.calledWith(
        'root',
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      );
      fetchDirChildren.resetHistory();
      expect(this.$('.fb-table-row')).to.have.length(1);
      return enterDir().then(() => {
        expect(this.$('.fb-table-row').text()).to.contain('Directory 4');
      });
    });
  });

  it('shows working paste button when invoked file copy from context menu',
    async function () {
      mockFilesTree(this, {
        f1: null,
        f2: {
          f3: null,
        },
      });
      const fileManager = lookupService(this, 'fileManager');
      const copyOrMoveFile = sinon.spy(fileManager, 'copyOrMoveFile');

      this.render(hbs `<div id="content-scroll">{{file-browser
        dir=dir
        selectedFiles=selectedFiles
        updateDirEntityId=updateDirEntityId
        changeSelectedFiles=(action (mut selectedFiles))
      }}</div>`);

      await wait();
      expect(this.$('.fb-table-row')).to.exist;

      await triggerEvent(this.$('.fb-table-row:contains("f1 name")')[0], 'contextmenu');
      await click('.file-action-copy');

      expect($('.file-action-paste'), 'file-action-paste').to.exist;

      const dirRow = this.$('.fb-table-row:contains("f2 name")')[0];
      dirRow.click();
      await dirRow.click();
      await click('.file-action-paste');

      expect(copyOrMoveFile).to.have.been
        .calledWith(this.get('elementsMap.f1'), 'f2', 'copy');
    }
  );

  ['symlink', 'hardlink'].forEach(linkType => {
    const upperLinkType = _.upperFirst(linkType);
    it(`shows working ${linkType} button when invoked file ${linkType} from context menu`,
      async function () {
        mockFilesTree(this, {
          f1: null,
          f2: {
            f3: null,
          },
        });
        const fileManager = lookupService(this, 'fileManager');
        const createLink = sinon.stub(
          fileManager,
          `create${upperLinkType}`
        ).resolves();

        this.render(hbs `<div id="content-scroll">{{file-browser
          dir=dir
          spaceId="myspaceid"
          selectedFiles=selectedFiles
          updateDirEntityId=updateDirEntityId
          changeSelectedFiles=(action (mut selectedFiles))
        }}</div>`);

        await wait();
        expect(this.$('.fb-table-row')).to.exist;

        await triggerEvent(this.$('.fb-table-row:contains("f1 name")')[0], 'contextmenu');
        await click(`.file-action-create${upperLinkType}`);

        expect($(`.file-action-place${upperLinkType}`)).to.exist;

        const dirRow = this.$('.fb-table-row:contains("f2 name")')[0];
        dirRow.click();
        await dirRow.click();
        await click(`.file-action-place${upperLinkType}`);

        const linkTarget = linkType === 'symlink' ?
          '<__onedata_space_id:myspaceid>/f1 name' : this.get('elementsMap.f1');
        expect(createLink).to.have.been
          .calledWith('f1 name', this.get('elementsMap.f2'), linkTarget);
      }
    );
  });

  it('has blocked hardlink creation for directories', async function () {
    mockFilesTree(this, {
      f1: {},
    });

    this.render(hbs `<div id="content-scroll">{{file-browser
      dir=dir
      selectedFiles=selectedFiles
      updateDirEntityId=updateDirEntityId
      changeSelectedFiles=(action (mut selectedFiles))
    }}</div>`);

    await wait();
    expect(this.$('.fb-table-row')).to.exist;

    await triggerEvent(this.$('.fb-table-row:contains("f1 name")')[0], 'contextmenu');
    expect($('.file-action-createHardlink').parent()).to.have.class('disabled');
  });

  it('shows empty dir message with working new directory button', function () {
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
      selectedFiles: Object.freeze([]),
    });

    this.render(hbs `<div id="content-scroll">{{file-browser
      dir=dir
      openCreateNewDirectory=openCreateNewDirectory
      selectedFiles=selectedFiles
      changeSelectedFiles=(action (mut selectedFiles))
    }}</div>`);

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.called;
      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.have.length(0);
        expect(this.$('.empty-dir')).to.exist;
        return click('.empty-dir-new-directory-action').then(() => {
          expect(openCreateNewDirectory).to.have.been.calledOnce;
          expect(openCreateNewDirectory).to.have.been.calledWith(dir);
        });
      });
    });
  });

  it('adds file-cut class if file is in clipboard in move mode', function () {
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

    this.render(hbs `<div id="content-scroll">{{file-browser
      dir=dir
      fileClipboardMode=fileClipboardMode
      fileClipboardFiles=fileClipboardFiles
    }}</div>`);

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.called;
      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.have.class('file-cut');
      });
    });
  });

  it('shows refresh button which invokes refresh file list API action',
    function () {
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
        selectedFiles: Object.freeze([]),
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

      this.render(hbs `<div id="content-scroll">{{file-browser
        dir=dir
        selectedFiles=selectedFiles
        updateDirEntityId=(action "updateDirEntityId")
        changeSelectedFiles=(action (mut selectedFiles))
      }}</div>`);

      return wait()
        .then(() => {
          expect(fetchDirChildren).to.be.called;
          fetchDirChildren.resetHistory();
          expect(this.$('.file-action-refresh')).to.exist;
          return click('.file-action-refresh');
        })
        .then(() => {
          expect(fetchDirChildren).to.be.called;
        });
    }
  );

  describe('selects using injected file ids', function () {
    it('visible file on list', function () {
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
      const selectedFilesForJump = [selectedFile];
      this.setProperties({
        dir,
        selectedFilesForJump,
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

      this.render(hbs `<div id="content-scroll">
        {{file-browser
          dir=dir
          selectedFiles=selectedFilesForJump
          selectedFilesForJump=selectedFilesForJump
        }}
      </div>`);

      return wait().then(() => {
        expect(fetchDirChildren).to.have.been.calledWith(
          entityId,
          sinon.match.any,
          selectedFile.index,
          sinon.match.any,
          sinon.match.any
        );
        return wait();
      }).then(() => {
        const $fileSelected = this.$('.file-selected');
        expect($fileSelected, 'selected file row').to.have.lengthOf(1);
        expect($fileSelected).to.have.attr('data-row-id', selectedFile.id);
      });
    });

    it('file that is out of initial list range', function () {
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
      const selectedFilesForJump = [selectedFile];
      this.setProperties({
        dir,
        selectedFilesForJump,
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

      this.render(hbs `<div id="content-scroll">
        {{file-browser
          dir=dir
          selectedFiles=selectedFilesForJump
          selectedFilesForJump=selectedFilesForJump
        }}
      </div>`);

      return wait().then(() => {
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
      });
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

      const item1 = {
        entityId: 'i1',
        name: 'A1',
        index: 'A1',
        hasParent: true,
        parent: resolve(dir),
      };

      this.setProperties({ dir, item1, selectedFiles: Object.freeze([]) });
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

      testDownloadFromContextMenu();
      testDownloadUsingDoubleClick();
    });

    context('when the only item is a directory', function () {
      beforeEach(function () {
        this.set('item1.type', 'dir');
      });

      testDownloadFromContextMenu();
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
    selectedFiles: Object.freeze([]),
  });
}

function testDownloadFromContextMenu() {
  const description =
    'shows spinner and starts download after using download context menu item';
  it(description, async function (done) {
    const btnId = this.get('item1.type') === 'dir' ? 'downloadTarGz' : 'download';
    testDownload(this, done, (fileId) => chooseFileContextMenuAction(fileId, btnId));
  });
}

function testDownloadUsingDoubleClick() {
  it('shows spinner and starts download after double click', async function (done) {
    testDownload(this, done, doubleClickFile);
  });
}

async function testDownload(testCase, done, invokeDownloadFunction) {
  const {
    fileId,
    getFileDownloadUrl,
    sleeper,
  } = prepareDownload(testCase);

  renderWithDownloadSpy(testCase);
  await wait();
  const $row = getFileRow(fileId);

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

function prepareDownload(testCase) {
  const fileId = testCase.get('item1.entityId');
  const fileManager = lookupService(testCase, 'fileManager');
  const sleeper = sleep(500);
  const getFileDownloadUrl = sinon.stub(fileManager, 'getFileDownloadUrl')
    .resolves(sleeper);
  const handleFileDownloadUrl = sinon.stub();
  testCase.set('handleFileDownloadUrl', handleFileDownloadUrl);
  return { fileId, getFileDownloadUrl, handleFileDownloadUrl, sleeper };
}

function renderWithDownloadSpy(testCase) {
  testCase.render(hbs `<div id="content-scroll">{{file-browser
    dir=dir
    selectedFiles=selectedFiles
    changeSelectedFiles=(action (mut selectedFiles))
    handleFileDownloadUrl=handleFileDownloadUrl
  }}</div>`);
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

function getFileRow(fileId) {
  const $row = $(`.fb-table-row[data-row-id=${fileId}]`);
  expect($row).to.have.length(1);
  return $row;
}

async function doubleClickFile(fileId) {
  const row = getFileRow(fileId)[0];
  click(row);
  await sleep(1);
  await click(row);
}

async function openFileContextMenu(fileId) {
  const $row = getFileRow(fileId);
  $row[0].dispatchEvent(new Event('contextmenu'));
  await wait();
  const $fileActions = $('.file-actions');
  expect($fileActions).to.have.length(1);
  return $fileActions;
}

async function chooseFileContextMenuAction(fileId, actionId) {
  const $fileActions = await openFileContextMenu(fileId);
  await click($fileActions.find(`.file-action-${actionId}`)[0]);
}
