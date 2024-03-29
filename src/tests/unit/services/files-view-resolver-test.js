import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { registerService, lookupService } from '../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';
import { set } from '@ember/object';
import { getFileGri } from 'oneprovider-gui/models/file';

const AppProxy = Service.extend({
  callParent() {},
});

const FileManager = Service.extend({
  getFileById() {},
  async getFileOwner() {},
});

describe('Unit | Service | files-view-resolver', function () {
  setupTest();

  beforeEach(function () {
    registerService(this, 'appProxy', AppProxy);
    registerService(this, 'fileManager', FileManager);
  });

  it('calls getDatasetsUrl on parent iframe to get URL for archive filesystem view when the view is requested from space filesystem view',
    async function () {
      const service = this.owner.lookup('service:files-view-resolver');
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
          archive: archiveId,
          dir: dirId,
          selectedDatasets: [datasetId],
          selectedFiles: null,
        }
      );
      expect(result.result).to.equal('redirect');
      expect(result.url).to.equal(fakeUrl);
      expect(result.filesViewContext).to.be.not.empty;
      expect(result.filesViewContext.isEqual(FilesViewContext.create({
        archiveId,
        datasetId,
        spaceId,
      }))).to.be.true;
    }
  );

  it('calls getDataUrl on parent iframe to get URL for space filesystem view when the view is requested from archive filesystem view',
    async function () {
      const service = this.owner.lookup('service:files-view-resolver');
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
          selected: null,
        }
      );
      expect(result.result).to.equal('redirect');
      expect(result.url).to.equal(fakeUrl);
      expect(result.filesViewContext).to.be.not.empty;
      expect(result.filesViewContext.isEqual(FilesViewContext.create({
        spaceId,
      }))).to.be.true;
    }
  );

  it('returns fallback dir if file fetch returns null',
    async function () {
      const service = this.owner.lookup('service:files-view-resolver');
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
      const createFromFile = sinon.stub();
      createFromFile.withArgs(fallbackDir).resolves(FilesViewContext.create({
        file: {},
        spaceId,
      }));
      set(service, 'filesViewContextFactory', {
        createFromFile,
      });

      const result = await service.resolveViewOptions({
        dirId,
        selectedIds: [],
        scope: 'private',
        fallbackDir,
        currentFilesViewContext,
      });

      expect(createFromFile).to.have.been.calledWith(fallbackDir);
      expect(callParent).to.have.not.been.called;
      expect(result.result).to.equal('resolve');
      expect(result.dir).to.equal(fallbackDir);
      expect(result.filesViewContext).to.be.not.empty;
      expect(result.filesViewContext.isEqual(FilesViewContext.create({
        spaceId,
      }))).to.be.true;
    }
  );

  it('returns resolved dir if file fetch returns space filesystem dir when in space filesystem view',
    async function () {
      const service = this.owner.lookup('service:files-view-resolver');
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
      expect(result.filesViewContext).to.be.not.empty;
      expect(result.filesViewContext.isEqual(FilesViewContext.create({
        spaceId,
      }))).to.be.true;
    }
  );

  it('resolves parent dir for first selected file ID if dirId is not provided', async function () {
    const store = lookupService(this, 'store');
    const service = this.owner.lookup('service:files-view-resolver');
    const fakeUrl = 'fake_url';
    const appProxy = lookupService(this, 'appProxy');
    const fileManager = lookupService(this, 'fileManager');
    const callParent = sinon.stub(appProxy, 'callParent').returns(fakeUrl);
    const spaceId = 'fake_space_id';
    const parentDir = await store.createRecord('file', {
      id: getFileGri('fake_parent_dir_id'),
      name: 'fake_parent_dir',
      type: 'dir',
    }).save();
    const selectedFile1 = await store.createRecord('file', {
      id: getFileGri('selected1'),
      name: 'selected1_name',
      type: 'file',
      parent: parentDir,
    }).save();
    const selectedFile2 = await store.createRecord('file', {
      id: getFileGri('selected2'),
      name: 'selected2_name',
      type: 'file',
      parent: parentDir,
    }).save();
    const fallbackDir = await store.createRecord('file', {
      id: getFileGri('fallback_dir_id'),
    }).save();
    const parentDirId = parentDir.entityId;
    const selectedDir1Id = selectedFile1.entityId;
    const selectedDir2Id = selectedFile2.entityId;
    const getFileById = sinon.stub(fileManager, 'getFileById');
    getFileById
      .withArgs(parentDirId, sinon.match({ scope: 'private' }))
      .resolves(parentDir);
    getFileById
      .withArgs(selectedDir1Id, sinon.match({ scope: 'private' }))
      .resolves(selectedFile1);
    getFileById
      .withArgs(selectedDir2Id, sinon.match({ scope: 'private' }))
      .resolves(selectedFile2);
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
    expect(getFileById).to.have.been.calledWith(
      selectedDir1Id,
      sinon.match({ scope: 'private' })
    );
    expect(result.result).to.equal('resolve');
    expect(result.dir).to.equal(parentDir);
    expect(result.filesViewContext).to.be.not.empty;
    expect(result.filesViewContext.isEqual(FilesViewContext.create({
      spaceId,
    }))).to.be.true;
  });
});
