import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { registerService, lookupService } from '../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
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
});

const I18n = Service.extend({
  t: () => '',
});

describe('Integration | Component | file browser', function () {
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
    ).resolves(files);
    fetchDirChildren.resolves([]);

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
      ).resolves(i === numberOfDirs - 1 ? [] : [dirs[i + 1]]);
    }
    fetchDirChildren.resolves([]);

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
      ).resolves(files1);
      fetchDirChildren.withArgs(
        'f2',
        sinon.match.any,
        null,
        sinon.match.any,
        0
      ).resolves(files2);
      fetchDirChildren.resolves([]);

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
      .resolves(files);
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
      .resolves(files);

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
      fetchDirChildren.resolves([{
        entityId: 'file1',
        name: 'File one',
      }]);

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
    });

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
      const selectedFiles = [selectedFile];
      this.setProperties({
        dir,
        selectedFiles,
      });
      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');

      fetchDirChildren.withArgs(
        entityId,
        sinon.match.any,
        selectedFile.index,
        sinon.match.any,
        sinon.match.any
      ).resolves([...files]);

      // default
      fetchDirChildren.resolves([]);

      this.render(hbs `<div id="content-scroll">
        {{file-browser dir=dir selectedFiles=selectedFiles}}
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
      const selectedFiles = [selectedFile];
      this.setProperties({
        dir,
        selectedFiles,
      });
      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');
      fetchDirChildren.withArgs(
        entityId, // dirId
        sinon.match.any, // scope
        selectedFile.index, // index
        sinon.match.any, // limit
        sinon.match.any // offset
      ).resolves([...files]);
      fetchDirChildren.withArgs(
        entityId,
        sinon.match.any,
        files[60].index,
        70,
        -10
      ).resolves(files.slice(50, 120));
      // default
      fetchDirChildren.resolves([]);

      this.render(hbs `<div id="content-scroll">
        {{file-browser dir=dir selectedFiles=selectedFiles}}
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
});
