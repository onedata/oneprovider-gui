import { expect } from 'chai';
import { describe, it, beforeEach, context } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { find } from 'ember-native-dom-helpers';
import { lookupService } from '../../helpers/stub-service';
import { all as allFulfilled } from 'rsvp';
import { getBrowsableArchiveName } from '../../helpers/archive-recall';
import { run } from '@ember/runloop';

describe('Integration | Component | archive settings', function () {
  setupComponentTest('archive-settings', {
    integration: true,
  });

  beforeEach(async function () {
    await run(() => createDataset(this));
    await run(() => createArchive(this));
  });

  it('renders "Archive settings" text and archive name in header', async function () {
    const name = await getBrowsableArchiveName(this);

    await render(this);

    const header = find('.archive-settings-modal-header');
    expect(header).to.exist;
    expect(header.textContent).to.contain('Archive settings');
    expect(header.textContent).to.contain(name);
  });

  it('renders "Description" field with label and textarea in edit mode', async function () {
    whenInEditMode(this);

    await render(this);

    const field = find('.description-field');
    expect(field).to.exist;
    expect(field.textContent).to.contain('Description');
    expect(field.querySelector('textarea')).to.exist;
  });
});

async function render(testCase) {
  if (!testCase.get('spacePrivileges')) {
    testCase.set('spacePrivileges', {
      viewArchives: true,
    });
  }
  testCase.render(hbs `
    {{#one-pseudo-modal id="pseudo-modal-id" as |modal|}}
      {{archive-settings
        browsableArchive=browsableArchive
        modal=modal
        spacePrivileges=spacePrivileges
        onClose=onClose
        onSubmit=onSubmit
      }}
    {{/one-pseudo-modal}}
  `);
  await wait();
}

// FIXME: refactor, move to common archive helpers
async function createDataset(testCase) {
  const store = lookupService(testCase, 'store');
  const spaceId = 's123';
  const fileName = 'dummy_dataset_root';
  const datasetRootFile = store.createRecord('file', {
    index: fileName,
    name: fileName,
    type: 'dir',
  });
  const dataset = store.createRecord('dataset', {
    index: 'd123',
    spaceId,
    state: 'attached',
    rootFile: datasetRootFile,
    rootFilePath: `/one/two/${fileName}`,
  });
  const records = [
    datasetRootFile,
    dataset,
  ];
  const result = testCase.setProperties({
    datasetRootFile,
    dataset,
  });
  await allFulfilled(Object.values(records).invoke('save'));
  return result;
}

async function createArchive(testCase) {
  const dataset = testCase.get('dataset');
  const store = lookupService(testCase, 'store');
  const archiveManager = lookupService(testCase, 'archiveManager');
  const totalFileCount = 100;
  const totalByteSize = 10000;
  const archive = store.createRecord('archive', {
    index: '123',
    state: 'preserved',
    creationTime: Date.now() / 1000,
    config: {
      createNestedArchives: false,
      incremental: {
        enabled: false,
      },
      layout: 'plain',
      includeDip: false,
    },
    description: 'foobarchive',
    stats: {
      filesArchived: totalFileCount,
      bytesArchived: totalByteSize,
      filesFailed: 0,
    },
    dataset,
  });
  const records = [
    archive,
  ];
  await allFulfilled(Object.values(records).invoke('save'));
  const browsableArchive = await archiveManager.getBrowsableArchive(archive);
  const result = testCase.setProperties({
    archive,
    browsableArchive,
  });
  return result;
}

function whenInEditMode(testCase) {
  testCase.set('spacePrivileges', {
    manageDatasets: true,
    createArchives: true,
  });
}
