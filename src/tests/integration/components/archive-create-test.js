import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { find } from 'ember-native-dom-helpers';
import { lookupService } from '../../helpers/stub-service';
import { all as allFulfilled } from 'rsvp';
import { getBrowsableDatasetName } from '../../helpers/archive-recall';

describe('Integration | Component | archive create', function () {
  setupComponentTest('archive-create', {
    integration: true,
  });

  beforeEach(async function () {
    await createDataset(this);
  });

  it('renders "Create archive" text and dataset name in header', async function () {
    const name = await getBrowsableDatasetName(this);

    await render(this);

    const header = find('.archive-create-header');
    expect(header).to.exist;
    expect(header.textContent).to.contain('Create archive');
    expect(header.textContent).to.contain(name);
  });

  it('renders "no archives view" warning if user does not have viewArchives privilege in space', async function () {
    this.set('spacePrivileges', {
      viewArchives: false,
    });

    await render(this);

    const alertElement = find('.no-archives-view-alert');
    expect(alertElement).to.exist;
    expect(alertElement.textContent).to.contain(
      'Created archive will not be visible as you do not have the "view archives" privilege in this space.'
    );
  });

  it('does not render "no archives view" warning if user has viewArchives privilege in space', async function () {
    this.set('spacePrivileges', {
      viewArchives: true,
    });

    await render(this);

    const alertElement = find('.no-archives-view-alert');
    expect(alertElement).to.not.exist;
  });

  it('renders "Description" field with label and textarea', async function () {
    await render(this);

    const field = find('.description-field');
    expect(field).to.exist;
    expect(field.textContent).to.contain('Description');
    expect(field.querySelector('textarea')).to.exist;
  });

  it('renders "Layout" field with label and two radio options: "plain", "BagIt"', async function () {
    await render(this);

    const field = find('.layout-field');
    expect(field).to.exist;
    expect(field.textContent).to.contain('Layout');
    const optionPlain = field.querySelector('.option-plain');
    expect(optionPlain.textContent).to.contain('plain');
    const optionBagit = field.querySelector('.option-bagit');
    expect(optionBagit.textContent).to.contain('BagIt');
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
      {{archive-create
        dataset=dataset
        modal=modal
        options=options
        spacePrivileges=spacePrivileges
        onClose=onClose
        onSubmit=onSubmit
      }}
    {{/one-pseudo-modal}}
  `);
  await wait();
}

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
