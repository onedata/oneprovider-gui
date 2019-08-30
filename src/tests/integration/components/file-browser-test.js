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

const UploadManager = Service.extend({
  assignUploadDrop() {},
  assignUploadBrowse() {},
  changeTargetDirectory() {},
});

const FileManager = Service.extend(Evented, {
  fetchDirChildren() {},
  copyOrMoveFile() {},
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
        entityId: 'f1',
        name: 'File 1',
        index: 'File 1',
      },
      {
        entityId: 'f2',
        name: 'File 2',
        index: 'File 2',
      },
      {
        entityId: 'f3',
        name: 'File 3',
        index: 'File 3',
      },
    ];
    this.set('dir', dir);
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren')
      .resolves(files);

    this.render(hbs `{{file-browser dir=dir}}`);

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.called;
      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.have.length(3);
      });
    });
  });

  it('changes directories on double click', function () {
    const numberOfDirs = 10;

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

    this.set('dir', rootDir);
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');

    for (let i = -1; i < numberOfDirs; ++i) {
      fetchDirChildren.withArgs(
        i === -1 ? 'root' : `file-${i}`,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      ).resolves(i === numberOfDirs - 1 ? [] : [dirs[i + 1]]);
    }

    this.render(hbs `{{file-browser dir=dir}}`);

    let clickCount = 8;
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
        sinon.match.any
      );
      expect(this.$('.fb-table-row')).to.have.length(1);
      return enterDir().then(() => {
        expect(this.$('.fb-table-row').text()).to.contain('Directory 9');
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
      this.set('dir', dir);
      const fileManager = lookupService(this, 'fileManager');
      const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren');
      const copyOrMoveFile = sinon.spy(fileManager, 'copyOrMoveFile');
      fetchDirChildren.withArgs(
        'root',
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      ).resolves(files1);
      fetchDirChildren.withArgs(
        'f2',
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      ).resolves(files2);

      this.render(hbs `{{file-browser dir=dir}}`);

      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.exist;
        this.$('.fb-table-row')[0].dispatchEvent(new Event('contextmenu'));
        return wait().then(() => {
          return click('.file-action-copy').then(() => {
            expect(this.$('.file-action-paste')).to.exist;
            const dirRow = this.$('.fb-table-row')[1];
            dirRow.click();
            return wait().then(() => {
              dirRow.click();
              dirRow.click();
              return wait().then(() => {
                return click('.file-action-paste').then(() => {
                  expect(copyOrMoveFile)
                    .have.been.calledWith(a1, 'f2', 'copy');
                });
              });
            });
          });
        });
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
    this.set('dir', dir);
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren')
      .resolves(files);
    const openCreateNewDirectory = sinon.spy();
    this.set('openCreateNewDirectory', openCreateNewDirectory);

    this.render(hbs `{{file-browser
      dir=dir
      openCreateNewDirectory=openCreateNewDirectory
    }}`);

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
    const fileManager = lookupService(this, 'fileManager');
    const fetchDirChildren = sinon.stub(fileManager, 'fetchDirChildren')
      .resolves(files);
    fileManager.setProperties({
      fileClipboardMode: 'move',
      fileClipboardFiles: [f1],
    });

    this.render(hbs `{{file-browser dir=dir}}`);

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.called;
      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.have.class('file-cut');
      });
    });
  });
});
