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

const UploadManager = Service.extend({
  assignUploadDrop() {},
  assignUploadBrowse() {},
  changeTargetDirectory() {},
});

const FileManager = Service.extend(Evented, {
  fetchDirChildren() {},
  copyOrMoveFile() {},
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
    function () {
      const dir = {
        entityId: 'root',
        name: 'Test directory',
        index: 'Test directory',
        type: 'dir',
        hasParent: false,
        parent: resolve(null),
      };
      const b1 = {
        entityId: 'f2',
        name: 'B1',
        index: 'B1',
        type: 'dir',
        hasParent: true,
        parent: resolve(dir),
      };
      const a1 = {
        entityId: 'f1',
        name: 'A1',
        index: 'A1',
        type: 'file',
        hasParent: true,
        parent: resolve(dir),
      };
      const files1 = [
        a1,
        b1,
      ];
      const files2 = [{
        entityId: 'f3',
        name: 'A2',
        index: 'A2',
        type: 'file',
        hasParent: true,
        parent: resolve(dir),
      }];

      const dirs = [dir, b1, a1];

      this.on('updateDirEntityId', function updateDirEntityId(id) {
        this.set('dir', dirs.findBy('entityId', id));
      });

      this.setProperties({
        dir,
        selectedFiles: Object.freeze([]),
      });

      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');
      const copyOrMoveFile = sinon.spy(fileManager, 'copyOrMoveFile');
      fetchDirChildren.withArgs(
        'root',
        sinon.match.any,
        null,
        sinon.match.any,
        0
      ).resolves({ childrenRecords: files1, isLast: true });
      fetchDirChildren.withArgs(
        'f2',
        sinon.match.any,
        null,
        sinon.match.any,
        0
      ).resolves({ childrenRecords: files2, isLast: true });
      fetchDirChildren.resolves({ childrenRecords: [], isLast: true });

      this.render(hbs `<div id="content-scroll">{{
        file-browser
        dir=dir
        selectedFiles=selectedFiles
        updateDirEntityId=(action "updateDirEntityId")
        changeSelectedFiles=(action (mut selectedFiles))
      }}</div>`);

      return wait()
        .then(() => {
          expect(this.$('.fb-table-row')).to.exist;
          this.$('.fb-table-row')[0].dispatchEvent(new Event('contextmenu'));
          return wait();
        })
        .then(() => {
          return click('.file-action-copy');
        })
        .then(() => {
          expect($('.file-action-paste'), 'file-action-paste').to.exist;
          const dirRow = this.$('.fb-table-row')[1];
          dirRow.click();
          return wait().then(() => ({ dirRow }));
        })
        .then(({ dirRow }) => {
          dirRow.click();
          dirRow.click();
          return wait();
        })
        .then(() => {
          return click('.file-action-paste');
        })
        .then(() => {
          expect(copyOrMoveFile)
            .have.been.calledWith(a1, 'f2', 'copy');
        });
    }
  );

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

      context('with space view privileges', function () {
        beforeEach(function () {
          this.set('spacePrivileges', { view: true });
        });

        it('has enabled datasets item in context menu', async function (done) {
          renderWithOpenDatasets(this);
          await wait();
          const $menu = await openFileContextMenu('i1');
          expect($menu.find('li:not(.disabled) .file-action-datasets')).to.exist;

          done();
        });

        testOpenDatasetsModal('dataset tag is clicked', async function () {
          await click(getFileRow('i1').find('.file-status-dataset')[0]);
        });

        testOpenDatasetsModal('dataset context menu item is clicked', async function () {
          await chooseFileContextMenuAction('i1', 'datasets');
        });
      });

      context('without space view privileges', function () {
        beforeEach(function () {
          this.set('spacePrivileges', { view: false });
        });

        it('has disabled datasets item in context menu', async function (done) {
          renderWithOpenDatasets(this);
          await wait();
          const $menu = await openFileContextMenu('i1');
          expect($menu.find('li.disabled .file-action-datasets')).to.exist;

          done();
        });
      });
    });
  });
});

function testOpenDatasetsModal(openDescription, openFunction) {
  it(`invokes datasets modal opening when ${openDescription}`, async function (done) {
    const openDatasets = sinon.spy();
    this.set('openDatasets', openDatasets);
    this.set('item1.hasEffDataset', true);

    renderWithOpenDatasets(this);

    expect(openDatasets).to.have.not.been.called;
    await openFunction.call(this);
    expect(openDatasets).to.have.been.calledOnce;

    done();
  });
}

function renderWithOpenDatasets(testCase) {
  if (!testCase.get('spacePrivileges')) {
    testCase.set('spacePrivileges', {});
  }
  testCase.render(hbs `<div id="content-scroll">{{file-browser
    dir=dir
    selectedFiles=selectedFiles
    changeSelectedFiles=(action (mut selectedFiles))
    openDatasets=openDatasets
    spacePrivileges=spacePrivileges
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

async function openFileContextMenu(fileId) {
  const $row = getFileRow(fileId);
  $row[0].dispatchEvent(new Event('contextmenu'));
  await wait();
  const $fileActions = $('.file-actions');
  expect($fileActions, 'file-actions').to.have.length(1);
  return $fileActions;
}

async function chooseFileContextMenuAction(fileId, actionId) {
  const $fileActions = await openFileContextMenu(fileId);
  await click($fileActions.find(`.file-action-${actionId}`)[0]);
}
