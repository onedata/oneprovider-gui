import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import {
  createArchiveRecallData,
  getBrowsableArchiveName,
  getBrowsableDatasetName,
} from '../../../helpers/archive-recall';
import { lookupService } from '../../../helpers/stub-service';
import sinon from 'sinon';

describe('Integration | Component | filesystem browser/recall info', function () {
  setupComponentTest('filesystem-browser/recall-info', {
    integration: true,
  });

  it('renders archive name, files recalled count and total files', async function () {
    createArchiveRecallData(this);
    const browsableArchiveName = await getBrowsableArchiveName(this);
    const targetFile = this.get('targetFile');
    this.set('archiveRecallInfo.totalFileCount', 100);
    this.set('archiveRecallState.filesCopied', 20);
    this.set('archiveRecallInfo.totalByteSize', 1024);
    this.set('archiveRecallState.bytesCopied', 200);
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $recallInfo = this.$('.recall-info');
    const text = $recallInfo.text();
    expect(text).to.contain(browsableArchiveName);
    expect(text).to.contain('20 / 100');
    expect(text).to.contain('200 B / 1 KiB');
  });

  it('renders dataset name', async function () {
    createArchiveRecallData(this);
    const browsableDatasetName = await getBrowsableDatasetName(this);
    const targetFile = this.get('targetFile');
    this.set('archiveRecallInfo.totalFileCount', 100);
    this.set('archiveRecallState.filesCopied', 20);
    this.set('archiveRecallInfo.totalByteSize', 1024);
    this.set('archiveRecallState.bytesCopied', 200);
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $row = this.$('.recall-info-row-dataset');
    expect(browsableDatasetName).to.be.not.empty;
    expect($row.text()).to.contain(browsableDatasetName);
  });

  it('renders path to recall root', async function () {
    createArchiveRecallData(this);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $value = this.$('.recall-info-row-target-path .property-value .file-path');
    expect($value.text()).to.match(
      /parent1\s*\/\s*parent2\s*\/\s*parent3\s*\/\s*test_file/
    );
  });

  it('renders number of failed files', async function () {
    createArchiveRecallData(this);
    this.set(
      'archiveRecallInfo.startTime',
      Date.now()
    );
    this.set(
      'archiveRecallInfo.finishTime',
      Date.now() + 10000
    );
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount')
    );
    this.set(
      'archiveRecallState.filesFailed',
      2
    );
    this.set(
      'archiveRecallState.lastError', { id: 'posix', details: { errno: 'enospc' } }
    );
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $value = this.$('.recall-info-row-files-failed .property-value');
    expect($value.text()).to.contain('2');
  });

  it('renders formatted start time if provided', async function () {
    createArchiveRecallData(this);
    const timestamp = Date.parse('Thu Jan 27 2022 16:42:11');
    this.set('archiveRecallInfo.startTime', timestamp);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $value = this.$('.recall-info-row-started-at .property-value');
    expect($value.text()).to.contain('27 Jan 2022 16:42:11');
  });

  it('renders formatted finish time if provided', async function () {
    createArchiveRecallData(this);
    const timestamp = Date.parse('Thu Jan 27 2022 16:42:11');
    this.set('archiveRecallInfo.finishTime', timestamp);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $value = this.$('.recall-info-row-finished-at .property-value');
    expect($value.text()).to.contain('27 Jan 2022 16:42:11');
  });

  it('does not render finish time row if not finished', async function () {
    createArchiveRecallData(this);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-info-row-finished-at')).to.not.exist;
  });

  it('has "recall scheduled" header if recall started', async function () {
    createArchiveRecallData(this);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-info-row-process-status .property-value').text())
      .to.contain('Archive recall scheduled');
  });

  it('has "recall in progress" with percentage completion header if recall started', async function () {
    createArchiveRecallData(this);
    this.set(
      'archiveRecallInfo.startTime',
      Date.now()
    );
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize') / 2
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount') / 2
    );
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-info-row-process-status .property-value').text())
      .to.match(/Archive recall in progress\s*\(50% done\)/);
  });

  it('has "recall finished successfully" header if recall finished without errors', async function () {
    createArchiveRecallData(this);
    this.set(
      'archiveRecallInfo.startTime',
      Date.now()
    );
    this.set(
      'archiveRecallInfo.finishTime',
      Date.now() + 10000
    );
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount')
    );
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-info-row-process-status .property-value').text())
      .to.contain('Archive recall finished successfully');
  });

  it('has "recall finished with errors" header if recall finished without errors', async function () {
    createArchiveRecallData(this);
    const totalFileCount = 10;
    const filesToFail = 5;
    this.set(
      'archiveRecallInfo.totalFileCount',
      totalFileCount
    );
    this.set(
      'archiveRecallInfo.startTime',
      Date.now()
    );
    this.set(
      'archiveRecallInfo.finishTime',
      Date.now() + 10000
    );
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize') * 0.2
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount') - filesToFail
    );
    this.set(
      'archiveRecallState.filesFailed',
      filesToFail
    );
    this.set(
      'archiveRecallState.lastError', { id: 'posix', details: { errno: 'enospc' } }
    );
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-info-row-process-status .property-value').text())
      .to.match(/Archive recall finished with errors\s+\(20% done\)/);
  });

  it('has href to archive on archive name link', async function () {
    createArchiveRecallData(this);
    const correctUrl = 'https://example.com/correct';
    const randomUrl = 'https://example.com/wrong';
    const appProxy = lookupService(this, 'appProxy');
    const callParent = sinon.stub(appProxy, 'callParent');
    const archiveId = this.get('archive.entityId');
    const datasetId = this.get('dataset.entityId');
    callParent.returns(randomUrl);
    callParent.withArgs(
      'getDatasetsUrl',
      sinon.match({
        selectedArchives: [archiveId],
        selectedDatasets: [datasetId],
      })
    ).returns(correctUrl);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $archiveLink = this.$('.archive-link');
    expect($archiveLink).to.have.attr('href', correctUrl);
  });

  it('has href to dataset on dataset name link', async function () {
    createArchiveRecallData(this);
    const correctUrl = 'https://example.com/correct';
    const randomUrl = 'https://example.com/wrong';
    const appProxy = lookupService(this, 'appProxy');
    const callParent = sinon.stub(appProxy, 'callParent');
    const datasetId = this.get('dataset.entityId');
    callParent.returns(randomUrl);
    callParent.withArgs(
      'getDatasetsUrl',
      sinon.match({
        selectedDatasets: [datasetId],
      })
    ).returns(correctUrl);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    const $datasetLink = this.$('.dataset-link');
    expect($datasetLink).to.have.attr('href', correctUrl);
  });
});

async function render(testCase) {
  testCase.render(hbs `{{filesystem-browser/recall-info
    file=file
  }}`);
  await wait();
}
