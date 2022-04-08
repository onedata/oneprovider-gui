import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import {
  createArchiveRecallData,
  getBrowsableArchiveName,
  getBrowsableDatasetName,
  whenOnLocalProvider,
} from '../../../helpers/datasets-archives';
import { lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';
import { click, find } from 'ember-native-dom-helpers';

describe('Integration | Component | file recall', function () {
  setupComponentTest('file-recall', {
    integration: true,
  });

  beforeEach(async function () {
    await createArchiveRecallData(this);
    whenOnLocalProvider(this);
    const targetFile = this.get('targetFile');
    this.setProperties({
      file: targetFile,
    });
  });

  it('renders archive name, files recalled count and total files', async function () {
    const browsableArchiveName = await getBrowsableArchiveName(this);
    this.set('archiveRecallInfo.totalFileCount', 100);
    this.set('archiveRecallState.filesCopied', 20);
    this.set('archiveRecallInfo.totalByteSize', 1024);
    this.set('archiveRecallState.bytesCopied', 200);

    await render(this);

    const $fileRecall = this.$('.file-recall-info-table');
    const text = $fileRecall.text();
    expect(text).to.contain(browsableArchiveName);
    expect(text).to.match(/20\s+\/\s+100/);
    expect(text).to.match(/200 B\s+\/\s+1 KiB/);
  });

  it('renders dataset name', async function () {
    const browsableDatasetName = await getBrowsableDatasetName(this);

    await render(this);

    const $row = this.$('.recall-info-row-dataset');
    expect(browsableDatasetName).to.be.not.empty;
    expect($row.text()).to.contain(browsableDatasetName);
  });

  it('renders path to recall root', async function () {
    await render(this);

    const $value = this.$('.recall-info-row-target-path .property-value .file-path');
    expect($value.text()).to.match(
      /parent1\s*\/\s*parent2\s*\/\s*parent3\s*\/\s*test_file/
    );
  });

  it('renders number of failed files', async function () {
    this.set('archiveRecallState.filesFailed', 2);

    await render(this);

    const $value = this.$('.recall-info-row-files-failed .property-value');
    expect($value.text()).to.contain('2');
  });

  it('renders formatted start time if provided', async function () {
    const timestamp = Date.parse('Thu Jan 27 2022 16:42:11');
    this.set('archiveRecallInfo.startTime', timestamp);
    await render(this);

    const $value = this.$('.recall-info-row-started-at .property-value');
    expect($value.text()).to.contain('27 Jan 2022 16:42:11');
  });

  it('renders formatted finish time if provided', async function () {
    const timestamp = Date.parse('Thu Jan 27 2022 16:42:11');
    this.set('archiveRecallInfo.finishTime', timestamp);

    await render(this);

    const $value = this.$('.recall-info-row-finished-at .property-value');
    expect($value.text()).to.contain('27 Jan 2022 16:42:11');
  });

  it('renders formatted cancel time if provided', async function () {
    const timestamp = Date.parse('Thu Jan 27 2022 16:42:11');
    this.set('archiveRecallInfo.cancelTime', timestamp);

    await render(this);

    const $value = this.$('.recall-info-row-cancelled-at .property-value');
    expect($value.text()).to.contain('27 Jan 2022 16:42:11');
  });

  it('does not render finish time row if not finished', async function () {
    this.set('archiveRecallInfo.finishTime', null);

    await render(this);

    expect(this.$('.recall-info-row-finished-at')).to.not.exist;
  });

  it('has "scheduled" status text if recall does not started', async function () {
    this.set('archiveRecallInfo.startTime', null);

    await render(this);

    expect(find('.recall-info-row-process-status .property-value').textContent)
      .to.contain('Scheduled');
  });

  it('has "in progress" status text with percentage completion header if recall started', async function () {
    this.set('archiveRecallInfo.startTime', Date.now());
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize') / 2
    );

    await render(this);

    expect(find('.recall-info-row-process-status .property-value').textContent)
      .to.match(/Ongoing\s*\(recall progress: 50%\)/);
  });

  it('has "finished successfully" status text if recall finished without errors', async function () {
    this.set('archiveRecallInfo.startTime', Date.now());
    this.set('archiveRecallInfo.finishTime', Date.now() + 10000);
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount')
    );

    await render(this);

    expect(find('.recall-info-row-process-status .property-value').textContent)
      .to.contain('Finished successfully');
  });

  it('has "finished with errors" status text with percentage done if recall finished with errors',
    async function () {
      const totalFileCount = 10;
      const filesToFail = 5;
      const lastError = {
        reason: { id: 'posix', details: { errno: 'enospc' } },
      };
      this.set('archiveRecallInfo.totalFileCount', totalFileCount);
      this.set('archiveRecallInfo.startTime', Date.now());
      this.set('archiveRecallInfo.finishTime', Date.now() + 10000);
      this.set(
        'archiveRecallState.bytesCopied',
        this.get('archiveRecallInfo.totalByteSize') * 0.2
      );
      this.set(
        'archiveRecallState.filesCopied',
        this.get('archiveRecallInfo.totalFileCount') - filesToFail
      );
      this.set('archiveRecallState.filesFailed', filesToFail);
      this.set('archiveRecallState.lastError', lastError);

      await render(this);

      expect(find('.recall-info-row-process-status .property-value').textContent)
        .to.match(/Finished with errors\s+\(recall progress: 20%\)/);
    }
  );

  it('has "cancelling" status text with percentage done while recall is cancelling', async function () {
    whenRecallIsCancelling(this);

    await render(this);

    expect(find('.recall-info-row-process-status .property-value').textContent)
      .to.match(/Cancelling\s*\(recall progress: 50%\)/);
    expect(this.$('.recall-info-row-process-status')).to.have.class('text-warning');
  });

  it('has "cancelled" status text with percentage done if recall is cancelled', async function () {
    whenRecallIsCancelled(this);

    await render(this);

    expect(find('.recall-info-row-process-status .property-value').textContent)
      .to.match(/Cancelled\s*\(recall progress: 50%\)/);
    expect(this.$('.recall-info-row-process-status')).to.have.class('text-warning');
  });

  it('has href to archive on archive name link', async function () {
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

    await render(this);

    const $archiveLink = this.$('.archive-link');
    expect($archiveLink).to.have.attr('href', correctUrl);
  });

  it('has href to dataset on dataset name link', async function () {
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

    await render(this);

    const $datasetLink = this.$('.dataset-link');
    expect($datasetLink).to.have.attr('href', correctUrl);
  });

  it('has "Cancel recall" button which clicked opens recall modal', async function () {
    whenRecallIsPending(this);

    await render(this);

    const $cancelRecallBtn = this.$('.cancel-recall-btn');

    expect($cancelRecallBtn).to.exist;
    expect($cancelRecallBtn.text()).to.contain('Cancel recall');
    expect(this.$('.cancel-recall-modal')).to.not.exist;
    await click($cancelRecallBtn[0]);
    expect(this.$('.cancel-recall-modal')).to.exist;
  });

  it('has "Cancelling recall..." disabled button when recall is being cancelled', async function () {
    whenRecallIsCancelling(this);

    await render(this);

    const $cancelRecallBtn = this.$('.cancel-recall-btn');

    expect($cancelRecallBtn).to.exist;
    expect($cancelRecallBtn.text()).to.contain('Cancelling recall...');
    expect($cancelRecallBtn).to.be.disabled;
    await click($cancelRecallBtn[0]);
    expect(this.$('.cancel-recall-modal')).to.not.exist;
  });
});

async function render(testCase) {
  testCase.render(hbs `
  {{#one-pseudo-modal id="pseudo-modal-id" as |modal|}}
    {{file-recall
      modal=modal
      file=file
      onClose=modal.close
    }}
  {{/one-pseudo-modal}}
  `);
  await wait();
}

function whenRecallIsCancelling(testCase) {
  testCase.set('archiveRecallInfo.startTime', Date(1000));
  testCase.set('archiveRecallInfo.cancelTime', Date(2000));
  testCase.set(
    'archiveRecallState.bytesCopied',
    testCase.get('archiveRecallInfo.totalByteSize') / 2
  );
}

function whenRecallIsCancelled(testCase) {
  testCase.set('archiveRecallInfo.startTime', Date(1000));
  testCase.set('archiveRecallInfo.cancelTime', Date(2000));
  testCase.set('archiveRecallInfo.finishTime', Date(3000));
  testCase.set(
    'archiveRecallState.bytesCopied',
    testCase.get('archiveRecallInfo.totalByteSize') / 2
  );
}

function whenRecallIsPending(testCase) {
  testCase.set('archiveRecallInfo.startTime', Date.now());
  testCase.set(
    'archiveRecallState.bytesCopied',
    testCase.get('archiveRecallInfo.totalByteSize') / 2
  );
}
