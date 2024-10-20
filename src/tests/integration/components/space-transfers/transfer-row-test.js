import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';
import { registerService, lookupService } from '../../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
import OneTooltipHelper from '../../../helpers/one-tooltip';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

const FilesViewResolver = Service.extend({
  async generateUrlById() { return 'https://dummy_url'; },
});

function notImplementedThrow(name, args) {
  throw new Error(`${name} not implemented, args: ${Array.from(args).join(',')}`);
}

const FileManager = Service.extend({
  async getFileOwner() {},
});
const DatasetManager = Service.extend({
  async getDataset() {
    notImplementedThrow('getDataset', arguments);
  },
  async getBrowsableDataset() {
    notImplementedThrow('getBrowsableDataset', arguments);
  },
});
const ArchiveManager = Service.extend({
  async getArchive() {
    notImplementedThrow('getArchive', arguments);
  },
  async getBrowsableArchive() {
    notImplementedThrow('getBrowsableArchive', arguments);
  },
});

describe('Integration | Component | space-transfers/transfer-row', function () {
  const { beforeEach, afterEach } = setupRenderingTest();

  beforeEach(function () {
    generateTestData(this);
    registerService(this, 'filesViewResolver', FilesViewResolver);
    registerService(this, 'fileManager', FileManager);
    registerService(this, 'datasetManager', DatasetManager);
    registerService(this, 'archiveManager', ArchiveManager);
  });

  afterEach(function () {
    this.get('record')?.destroy();
  });

  it('renders file name', async function () {
    this.set('record.transfer.dataSourceName', '/space_name/onedir/onefile_txt');

    await renderComponent();

    expect(find('.transfer-file-name').textContent).to.match(/^\s*onefile_txt\s*$/);
  });

  it('renders tooltip with file path on link hover', async function () {
    const path = '/space_name/onedir/onefile_txt';
    this.set('record.transfer.dataSourceName', path);

    await renderComponent();

    expect(await new OneTooltipHelper('.transfer-file-name').getText())
      .to.match(new RegExp(`^File:\\s+${path}`));
  });

  it('renders tooltip with dataset info, archive info and file path on link hover', async function () {
    const path =
      '/.__onedata__archive/dataset_archives_ds123/archive_a123/hello/onefile_txt';
    this.set('record.transfer.dataSourceName', path);
    const datasetManager = lookupService(this, 'datasetManager');
    const archiveManager = lookupService(this, 'archiveManager');
    sinon.stub(datasetManager, 'getBrowsableDataset').withArgs('ds123').resolves({
      name: 'dataset_name',
    });
    sinon.stub(archiveManager, 'getBrowsableArchive').withArgs('a123').resolves({
      name: 'archive_name',
    });

    await renderComponent();

    const tooltipText = await new OneTooltipHelper('.transfer-file-name').getText();
    expect(tooltipText).to.match(new RegExp('Dataset:\\s+dataset_name'));
    expect(tooltipText).to.match(new RegExp('Archive:\\s+archive_name'));
    expect(tooltipText).to.match(new RegExp('File:\\s+/hello/onefile_txt'));
  });

  it('renders tooltip with dataset ID, archive ID and relative file path if dataset containg file cannot be fetched',
    async function () {
      const path =
        '/.__onedata__archive/dataset_archives_ds123/archive_a123/hello/onefile_txt';
      this.set('record.transfer.dataSourceName', path);
      const datasetManager = lookupService(this, 'datasetManager');
      const archiveManager = lookupService(this, 'archiveManager');
      sinon.stub(datasetManager, 'getBrowsableDataset').withArgs('ds123').rejects({
        type: 'posix',
        details: {
          errno: 'enoent',
        },
      });
      sinon.stub(archiveManager, 'getBrowsableArchive').withArgs('a123').rejects({
        type: 'posix',
        details: {
          errno: 'enoent',
        },
      });

      await renderComponent();

      const tooltipText = await new OneTooltipHelper('.transfer-file-name').getText();
      expect(tooltipText).to.match(new RegExp('Dataset:\\s+ds123'));
      expect(tooltipText).to.match(new RegExp('Archive:\\s+a123'));
      expect(tooltipText).to.match(new RegExp('File:\\s+/hello/onefile_txt'));
    }
  );

  it('renders tooltip with dataset name, archive ID and relative file path if archive containg file cannot be fetched',
    async function () {
      const path =
        '/.__onedata__archive/dataset_archives_ds123/archive_a123/hello/onefile_txt';
      this.set('record.transfer.dataSourceName', path);
      const datasetManager = lookupService(this, 'datasetManager');
      const archiveManager = lookupService(this, 'archiveManager');
      sinon.stub(datasetManager, 'getBrowsableDataset').withArgs('ds123').resolves({
        name: 'dataset_name',
      });
      sinon.stub(archiveManager, 'getBrowsableArchive').withArgs('a123').rejects({
        type: 'posix',
        details: {
          errno: 'enoent',
        },
      });

      await renderComponent();

      const tooltipText = await new OneTooltipHelper('.transfer-file-name').getText();
      expect(tooltipText).to.match(new RegExp('Dataset:\\s+dataset_name'));
      expect(tooltipText).to.match(new RegExp('Archive:\\s+a123'));
      expect(tooltipText).to.match(new RegExp('File:\\s+/hello/onefile_txt'));
    }
  );

  it('renders tooltip with DB index name on link hover when transferred object is a view', async function () {
    const dbIndexName = 'my_db_index';
    this.set('record.transfer.dataSourceType', 'view');
    this.set('record.transfer.dataSourceName', dbIndexName);

    await renderComponent();

    expect(await new OneTooltipHelper('.transfer-db-index-name').getText())
      .to.match(new RegExp(`^View:\\s+${dbIndexName}`));
  });

  [
    'file',
    'directory',
  ].forEach(fileTypeLong => {
    const fileType = fileTypeLong === 'directory' ? 'dir' : 'file';
    const isDir = fileType === 'dir';
    it(`renders tooltip with ${fileTypeLong} name and deletion information on link hover when transferred object is a ${fileTypeLong} and it has been deleted`,
      async function () {
        const path = `/space_name/onedir/one_${fileType}`;
        this.set('record.transfer.dataSourceName', path);
        this.set('record.transfer.dataSourceType', 'deleted');
        this.set('record.transfer.transferProgressProxy', promiseObject(resolve({
          status: 'completed',
          replicatedFiles: isDir ? 2 : 1,
          evictedFiles: 0,
        })));

        await renderComponent();

        expect(await new OneTooltipHelper('.transfer-data-name').getText())
          .to.match(new RegExp(`^${isDir ? 'Directory' : 'File'}:\\s+${path}\\s+.*deleted`));
      }
    );
  });
});

function generateTestData(testCase) {
  const record = TransferTableRecord.create({
    ownerSource: testCase.owner,
    transfer: {
      type: 'replication',
      entityId: '3281239312ip232813',
      isOngoing: false,
      dataSourceName: '/space_name/onedir/onefile',
      dataSourceType: 'file',
      dataSourceId: 'f1',
      userId: 'u1',
      queryParams: {},
      scheduleTime: 1,
    },
  });
  const columns = [{
    id: 'path',
    propertyName: 'path',
    component: 'cell-data-name',
  }];
  const transfersTable = {};
  const forbiddenOperations = {};
  const transferActions = [];
  testCase.setProperties({
    record,
    columns,
    transfersTable,
    forbiddenOperations,
    transferActions,
    openDbViewModal: () => {},
  });
}

async function renderComponent() {
  await render(hbs `{{space-transfers/transfer-row
    record=record
    columns=columns
    transfersTable=transfersTable
    forbiddenOperations=forbiddenOperations
    transferActions=transferActions
    openDbViewModal=openDbViewModal
  }}`);
}
