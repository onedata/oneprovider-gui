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
    this.set('archiveRecallInfo.targetFiles', 100);
    this.set('archiveRecallState.currentFiles', 20);
    this.set('archiveRecallInfo.targetBytes', 1024);
    this.set('archiveRecallState.currentBytes', 200);
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
    this.set('archiveRecallInfo.targetFiles', 100);
    this.set('archiveRecallState.currentFiles', 20);
    this.set('archiveRecallInfo.targetBytes', 1024);
    this.set('archiveRecallState.currentBytes', 200);
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
      'archiveRecallInfo.startTimestamp',
      Date.now()
    );
    this.set(
      'archiveRecallInfo.finishTimestamp',
      Date.now() + 10000
    );
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes')
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles')
    );
    this.set(
      'archiveRecallState.failedFiles',
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
    this.set('archiveRecallInfo.startTimestamp', timestamp);
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
    this.set('archiveRecallInfo.finishTimestamp', timestamp);
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

    expect(this.$('.recall-status-header').text())
      .to.contain('Archive recall scheduled');
  });

  it('has "recall in progress" with percentage completion header if recall started', async function () {
    createArchiveRecallData(this);
    this.set(
      'archiveRecallInfo.startTimestamp',
      Date.now()
    );
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes') / 2
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles') / 2
    );
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-status-header').text())
      .to.match(/Archive recall in progress\s*\(50% done\)/);
  });

  it('has "recall finished successfully" header if recall finished without errors', async function () {
    createArchiveRecallData(this);
    this.set(
      'archiveRecallInfo.startTimestamp',
      Date.now()
    );
    this.set(
      'archiveRecallInfo.finishTimestamp',
      Date.now() + 10000
    );
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes')
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles')
    );
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });

    await render(this);

    expect(this.$('.recall-status-header').text())
      .to.contain('Archive recall finished successfully');
  });

  it('has "recall finished with errors" header if recall finished without errors', async function () {
    createArchiveRecallData(this);
    const targetFiles = 10;
    const filesToFail = 5;
    this.set(
      'archiveRecallInfo.targetFiles',
      targetFiles
    );
    this.set(
      'archiveRecallInfo.startTimestamp',
      Date.now()
    );
    this.set(
      'archiveRecallInfo.finishTimestamp',
      Date.now() + 10000
    );
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes')
    );
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes') * 0.2
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles') - filesToFail
    );
    this.set(
      'archiveRecallState.failedFiles',
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

    expect(this.$('.recall-status-header').text())
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

  // FIXME: renders archive id if archive cannot be resolved
  // FIXME: renders dataset id if dataset cannot be resolved
  // FIXME: shows loading indicator until info and state is loaded, but does not appear on update
  // FIXME: last error should be parsed and/or displayed in textarea
});

async function render(testCase) {
  testCase.render(hbs `{{filesystem-browser/recall-info
    file=file
  }}`);
  await wait();
}
