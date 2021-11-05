import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';
import { registerService, lookupService } from '../../../helpers/stub-service';
import Service from '@ember/service';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import OneTooltipHelper from '../../../helpers/one-tooltip';

const FilesViewResolver = Service.extend({
  async generateUrlById() { return 'https://dummy_url'; },
});

function notImplementedThrow(name, args) {
  throw new Error(`${name} not implemented, args: ${Array.from(args).join(',')}`);
}

const FileManager = Service.extend({});
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

describe('Integration | Component | space transfers/transfer row', function () {
  setupComponentTest('space-transfers/transfer-row', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'filesViewResolver', FilesViewResolver);
    registerService(this, 'fileManager', FileManager);
    registerService(this, 'datasetManager', DatasetManager);
    registerService(this, 'archiveManager', ArchiveManager);
  });

  it('renders file name', async function () {
    generateTestData(this);
    this.set('record.transfer.dataSourceName', '/space_name/onedir/onefile_txt');

    await render(this);

    expect(this.$('.transfer-file-name').text()).to.match(/^\s*onefile_txt\s*$/);
  });

  it('renders tooltip with file path on link hover', async function () {
    generateTestData(this);
    const path = '/space_name/onedir/onefile_txt';
    this.set('record.transfer.dataSourceName', path);

    await render(this);

    expect(await new OneTooltipHelper('.transfer-file-name').getText())
      .to.match(new RegExp(`^File:\\s+${path}`));
  });

  it('renders tooltip with dataset info, archive info and file path on link hover', async function () {
    generateTestData(this);
    const path = '/space_name/.__onedata__archive/dataset_archives_ds123/archive_a123/hello/onefile_txt';
    this.set('record.transfer.dataSourceName', path);
    const datasetManager = lookupService(this, 'datasetManager');
    const archiveManager = lookupService(this, 'archiveManager');
    sinon.stub(datasetManager, 'getBrowsableDataset').withArgs('ds123').resolves({
      name: 'dataset_name',
    });
    sinon.stub(archiveManager, 'getBrowsableArchive').withArgs('a123').resolves({
      name: 'archive_name',
    });

    await render(this);

    const tooltipText = await new OneTooltipHelper('.transfer-file-name').getText();
    expect(tooltipText).to.match(new RegExp('Dataset:\\s+dataset_name'));
    expect(tooltipText).to.match(new RegExp('Archive:\\s+archive_name'));
    expect(tooltipText).to.match(new RegExp('File:\\s+/hello/onefile_txt'));
  });
});

function generateTestData(testCase) {
  const record = TransferTableRecord.create({
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

async function render(testCase) {
  testCase.render(hbs `{{space-transfers/transfer-row
    record=record
    columns=columns
    transfersTable=transfersTable
    forbiddenOperations=forbiddenOperations
    transferActions=transferActions
  }}`);
  await wait();
}
