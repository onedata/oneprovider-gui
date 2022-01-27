import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';
import {
  createArchiveRecallData,
  getBrowsableArchiveName,
  getBrowsableDatasetName,
} from '../../../helpers/archive-recall';

describe('Integration | Component | filesystem browser/recall info', function () {
  setupComponentTest('filesystem-browser/recall-info', {
    integration: true,
  });

  it('shows archive name, files recalled count and total files', async function () {
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

  it('shows dataset name', async function () {
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

  // FIXME: renders archive link
  // FIXME: renders archive id if archive cannot be resolved
  // FIXME: renders dataset link
  // FIXME: renders dataset id if dataset cannot be resolved
  // FIXME: shows loading indicator until info and state is loaded, but does not appear on update
});

async function render(testCase) {
  testCase.render(hbs `{{filesystem-browser/recall-info
    file=file
  }}`);
  await wait();
}
