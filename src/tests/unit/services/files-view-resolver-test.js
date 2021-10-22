import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { registerService, lookupService } from '../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';
import { set } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

const AppProxy = Service.extend({
  callParent() {},
});

const FileManager = Service.extend({
  getFileById() {},
});

describe('Unit | Service | files view resolver', function () {
  setupTest('service:files-view-resolver', {});

  beforeEach(function () {
    registerService(this, 'appProxy', AppProxy);
    registerService(this, 'fileManager', FileManager);
  });

  it('calls getDatasetsUrl on parent iframe to get URL for archive filesystem view when the view is requested from space filesystem view',
    async function () {
      const service = this.subject();
      const fakeUrl = 'fake_url';
      const appProxy = lookupService(this, 'appProxy');
      const fileManager = lookupService(this, 'fileManager');
      const callParent = sinon.stub(appProxy, 'callParent').returns(fakeUrl);
      const spaceId = 'fake_space_id';
      const datasetId = 'fake_dataset_id';
      const archiveId = 'fake_archive_id';
      const dir = {
        entityId: 'fake_dir_id',
        name: 'fake_dir_inside_archive',
        type: 'dir',
      };
      const dirId = dir.entityId;
      sinon.stub(fileManager, 'getFileById').withArgs(dirId).resolves(dir);
      const currentFilesViewContext = FilesViewContext.create({
        file: {},
        archiveId: null,
        datasetId: null,
        spaceId,
      });
      set(service, 'filesViewContextFactory', {
        async createFromFile(file) {
          if (file !== dir) {
            throw new Error('createFromFile not stubbed for', file);
          }
          return FilesViewContext.create({
            file,
            archiveId,
            datasetId,
            spaceId,
          });
        },
      });

      const result = await service.resolveViewOptions({
        dirId,
        selectedIds: [],
        scope: 'private',
        fallbackDir: {},
        currentFilesViewContext,
      });

      expect(callParent).to.have.been.calledOnce;
      expect(callParent).to.have.been.calledWith(
        'getDatasetsUrl', {
          datasetId,
          archive: archiveId,
          dir: dirId,
          viewMode: 'files',
        }
      );
      expect(result.result).to.equal('redirect');
      expect(result.url).to.equal(fakeUrl);
    }
  );

  it('calls getDataUrl on parent iframe to get URL for space filesystem view when the view is requested from archive filesystem view',
    async function () {
      const service = this.subject();
      const fakeUrl = 'fake_url';
      const appProxy = lookupService(this, 'appProxy');
      const fileManager = lookupService(this, 'fileManager');
      const callParent = sinon.stub(appProxy, 'callParent').returns(fakeUrl);
      const spaceId = 'fake_space_id';
      const datasetId = 'fake_dataset_id';
      const archiveId = 'fake_archive_id';
      const dir = {
        entityId: 'fake_dir_id',
        name: 'fake_dir',
        type: 'dir',
      };
      const dirId = dir.entityId;
      sinon.stub(fileManager, 'getFileById').withArgs(dirId).resolves(dir);
      const currentFilesViewContext = FilesViewContext.create({
        file: {},
        archiveId,
        datasetId,
        spaceId,
      });
      set(service, 'filesViewContextFactory', {
        async createFromFile(file) {
          return FilesViewContext.create({
            file,
            archiveId: null,
            datasetId: null,
            spaceId,
          });
        },
      });

      const result = await service.resolveViewOptions({
        dirId,
        selectedIds: [],
        scope: 'private',
        fallbackDir: {},
        currentFilesViewContext,
      });

      expect(callParent).to.have.been.calledOnce;
      expect(callParent).to.have.been.calledWith(
        'getDataUrl', {
          fileId: dirId,
        }
      );
      expect(result.result).to.equal('redirect');
      expect(result.url).to.equal(fakeUrl);
    }
  );

  it('returns fallback dir if file fetch returns null',
    async function () {
      const service = this.subject();
      const fakeUrl = 'fake_url';
      const appProxy = lookupService(this, 'appProxy');
      const fileManager = lookupService(this, 'fileManager');
      const callParent = sinon.stub(appProxy, 'callParent').returns(fakeUrl);
      const spaceId = 'fake_space_id';
      const fallbackDir = {};
      const dirId = 'fake_dir_id';
      sinon.stub(fileManager, 'getFileById').resolves(null);
      const currentFilesViewContext = FilesViewContext.create({
        file: {},
        spaceId,
      });
      set(service, 'filesViewContextFactory', {
        async createFromFile() {
          throw new Error('createFromFile should not be invoked');
        },
      });

      const result = await service.resolveViewOptions({
        dirId,
        selectedIds: [],
        scope: 'private',
        fallbackDir,
        currentFilesViewContext,
      });

      expect(callParent).to.have.not.been.called;
      expect(result.result).to.equal('resolve');
      expect(result.dir).to.equal(fallbackDir);
    }
  );

  it('returns resolved dir if file fetch returns space filesystem dir when in space filesystem view',
    async function () {
      const service = this.subject();
      const fakeUrl = 'fake_url';
      const appProxy = lookupService(this, 'appProxy');
      const fileManager = lookupService(this, 'fileManager');
      const callParent = sinon.stub(appProxy, 'callParent').returns(fakeUrl);
      const spaceId = 'fake_space_id';
      const dir = {
        entityId: 'fake_dir_id',
        name: 'fake_dir',
        type: 'dir',
      };
      const fallbackDir = {};
      const dirId = dir.entityId;
      sinon.stub(fileManager, 'getFileById').withArgs(dirId).resolves(dir);
      const currentFilesViewContext = FilesViewContext.create({
        file: {},
        spaceId,
      });
      set(service, 'filesViewContextFactory', {
        async createFromFile(file) {
          if (file !== dir) {
            throw new Error('createFromFile not stubbed for', file);
          }
          return FilesViewContext.create({
            file,
            spaceId,
          });
        },
      });

      const result = await service.resolveViewOptions({
        dirId,
        selectedIds: [],
        scope: 'private',
        fallbackDir,
        currentFilesViewContext,
      });

      expect(callParent).to.have.not.been.called;
      expect(result.result).to.equal('resolve');
      expect(result.dir).to.equal(dir);
    }
  );

  it('resolves parent dir for first selected file ID if dirId is not provided', async function () {
    const service = this.subject();
    const fakeUrl = 'fake_url';
    const appProxy = lookupService(this, 'appProxy');
    const fileManager = lookupService(this, 'fileManager');
    const callParent = sinon.stub(appProxy, 'callParent').returns(fakeUrl);
    const spaceId = 'fake_space_id';
    const parentDir = {
      entityId: 'fake_parent_dir_id',
      name: 'fake_parent_dir',
      type: 'dir',
      hasParent: false,
    };
    const selectedFile1 = {
      entityId: 'selected1',
      name: 'selected1_name',
      type: 'file',
      parent: promiseObject(resolve(parentDir)),
      hasParent: true,
    };
    const selectedFile2 = {
      entityId: 'selected2',
      name: 'selected2_name',
      type: 'file',
      parent: promiseObject(resolve(parentDir)),
      hasParent: true,
    };
    const fallbackDir = { entityId: 'fallback_dir_id' };
    const parentDirId = parentDir.entityId;
    const selectedDir1Id = selectedFile1.entityId;
    const selectedDir2Id = selectedFile2.entityId;
    const getFileById = sinon.stub(fileManager, 'getFileById');
    getFileById.withArgs(parentDirId, 'private').resolves(parentDir);
    getFileById.withArgs(selectedDir1Id, 'private').resolves(selectedFile1);
    getFileById.withArgs(selectedDir2Id, 'private').resolves(selectedFile2);
    // getFileById.withArgs(selectedDir1Id, 'private').returns('xp');
    // .returns('xddd');
    const currentFilesViewContext = FilesViewContext.create({
      file: {},
      spaceId,
    });
    set(service, 'filesViewContextFactory', {
      async createFromFile(file) {
        return FilesViewContext.create({
          file,
          spaceId,
        });
      },
    });

    const result = await service.resolveViewOptions({
      dirId: null,
      selectedIds: [selectedDir1Id, selectedDir2Id],
      scope: 'private',
      fallbackDir,
      currentFilesViewContext,
    });

    expect(callParent).to.have.not.been.called;
    expect(getFileById).to.have.been.calledWith(selectedDir1Id, 'private');
    expect(result.result).to.equal('resolve');
    expect(result.dir).to.equal(parentDir);
  });
});
