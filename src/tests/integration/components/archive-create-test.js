import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, click, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { getBrowsableDatasetName, createDataset } from '../../helpers/datasets-archives';
import sinon from 'sinon';
import { lookupService } from '../../helpers/stub-service';

describe('Integration | Component | archive-create', function () {
  setupRenderingTest();

  beforeEach(async function () {
    this.set('onClose', function () {});
    await createDataset(this);
  });

  it('renders "Create archive" text and dataset name in header', async function () {
    const name = await getBrowsableDatasetName(this);

    await renderComponent(this);

    const header = find('.archive-create-header');
    expect(header).to.exist;
    expect(header.textContent).to.contain('Create archive');
    expect(header.textContent).to.contain(name);
  });

  it('renders "no archives view" warning if user does not have viewArchives privilege in space', async function () {
    this.set('spacePrivileges', {
      viewArchives: false,
    });

    await renderComponent(this);

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

    await renderComponent(this);

    const alertElement = find('.no-archives-view-alert');
    expect(alertElement).to.not.exist;
  });

  it('renders "Description" field with label and textarea', async function () {
    await renderComponent(this);

    const field = find('.description-field');
    expect(field).to.exist;
    expect(field.textContent).to.contain('Description');
    expect(field.querySelector('textarea')).to.exist;
  });

  it('renders "Layout" field with label and two radio options: "plain", "BagIt"', async function () {
    await renderComponent(this);

    const field = find('.layout-field');
    expect(field).to.exist;
    expect(field.textContent).to.contain('Layout');
    const optionPlain = field.querySelector('.option-plain');
    expect(optionPlain.textContent).to.contain('plain');
    const optionBagit = field.querySelector('.option-bagit');
    expect(optionBagit.textContent).to.contain('BagIt');
  });

  it('calls onSubmit with archive data when submit button is clicked', async function () {
    const myDescription = 'my description';
    const onSubmit = sinon.spy();
    this.set('onSubmit', onSubmit);
    const archiveManager = lookupService(this, 'archiveManager');
    sinon.stub(archiveManager, 'fetchDatasetArchives').resolves({
      childrenRecords: [],
      isLast: true,
    });
    await renderComponent(this);

    await fillIn('.description-field textarea', myDescription);
    await click('.option-bagit input');
    await click('.createNestedArchives-field .form-control');
    await click('.includeDip-field .form-control');
    await click('.followSymlinks-field .form-control');
    await click('.submit-archive-creation-btn');

    expect(onSubmit).to.have.been.calledOnce;
    expect(onSubmit).to.have.been.calledWith(sinon.match({
      description: myDescription,
      config: {
        createNestedArchives: true,
        layout: 'bagit',
        includeDip: true,
        followSymlinks: false,
      },
    }));
  });
});

async function renderComponent(testCase) {
  if (!testCase.get('spacePrivileges')) {
    testCase.set('spacePrivileges', {
      viewArchives: true,
    });
  }
  await render(hbs `
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
}
