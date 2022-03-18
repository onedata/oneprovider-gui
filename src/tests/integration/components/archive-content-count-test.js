import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { find } from 'ember-native-dom-helpers';
import { lookupService } from '../../helpers/stub-service';

describe('Integration | Component | archive content count', function () {
  setupComponentTest('archive-content-count', {
    integration: true,
  });

  it('renders "unknown number of files" text, when files count is not provided', async function () {
    this.set('archive', {
      stats: {
        bytesArchived: 1,
      },
    });

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.contain('unknown number of files');
  });

  it('renders "unknown size" text, when size is not provided', async function () {
    this.set('archive', {
      stats: {
        filesArchived: 1,
      },
    });

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.contain('unknown size');
  });

  it('renders a dash only, when archive is not provided', async function () {
    this.set('archive', null);

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.match(/^\s*–\s*$/);
  });

  it('renders number of files in archive with single file', async function () {
    const filesArchived = 1;
    createArchive(this, {
      stats: {
        filesArchived,
      },
    });

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.match(/^.*1 file($|[^s])/);
  });

  it('renders number of files in archive with multiple files', async function () {
    const filesArchived = 10;
    const bytesArchived = Math.pow(1024, 3);
    createArchive(this, {
      stats: {
        filesArchived,
        bytesArchived,
      },
    });

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.contain('10 files');
  });

  it('renders size of archive', async function () {
    const bytesArchived = Math.pow(1024, 3);
    createArchive(this, {
      stats: {
        bytesArchived,
      },
    });

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.contain('1 GiB');
  });

  it('renders files count and size of archive separated with comma', async function () {
    const filesArchived = 10;
    const bytesArchived = Math.pow(1024, 3);
    createArchive(this, {
      stats: {
        filesArchived,
        bytesArchived,
      },
    });

    await renderComponent(this);

    const archiveContentCount = find('.archive-content-count');
    expect(archiveContentCount.textContent).to.contain('10 files, 1 GiB');
  });
});

async function renderComponent(testCase) {
  testCase.render(hbs `{{archive-content-count archive=archive}}`);
  await wait();
}

function createArchive(testCase, data) {
  const store = lookupService(testCase, 'store');
  const archive = store.createRecord('archive', data);
  testCase.set('archive', archive);
  return archive;
}
