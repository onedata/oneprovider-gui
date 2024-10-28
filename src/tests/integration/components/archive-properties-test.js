import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import {
  createArchive,
  createDataset,
} from '../../helpers/datasets-archives';
import { run } from '@ember/runloop';
import ArchivePropertiesViewModel from 'oneprovider-gui/utils/archive-properties-view-model';

describe('Integration | Component | archive-properties', function () {
  const { beforeEach, afterEach } = setupRenderingTest();

  beforeEach(async function () {
    await run(() => createDataset(this));
    await run(() => createArchive(this));
  });

  afterEach(function () {
    this.get('viewModel')?.destroy();
  });

  it('renders "Description" field with label and textarea in edit mode', async function () {
    whenInEditMode(this);

    await renderComponent(this);

    const field = find('.description-field');
    expect(field).to.exist;
    expect(field.textContent).to.contain('Description');
    expect(field.querySelector('textarea')).to.exist;
  });

  it('does not render callback fields in edit mode when not provided', async function () {
    whenInEditMode(this);

    await renderComponent(this);

    const preservedField = find('.preservedCallback-field');
    const deletedField = find('.deletedCallback-field');
    expect(preservedField).to.not.exist;
    expect(deletedField).to.not.exist;
  });

  it('renders callback fields in edit mode when provided', async function () {
    whenInEditMode(this);
    const archive = this.get('archive');
    const preservedValue = 'https://example.org/preserved_archives';
    const deletedValue = 'https://example.org/deleted_archives';

    run(() => {
      archive.setProperties({
        preservedCallback: preservedValue,
        deletedCallback: deletedValue,
      });
    });

    await renderComponent(this);

    const preservedField = find('.preservedCallback-field');
    const deletedField = find('.deletedCallback-field');
    expect(preservedField).to.exist;
    expect(preservedField.textContent).to.contain('Preserved callback URL');
    expect(preservedField.querySelector('input')).to.exist;
    expect(preservedField.querySelector('input').value).to.equal(preservedValue);
    expect(deletedField).to.exist;
    expect(deletedField.textContent).to.contain('Deleted callback URL');
    expect(deletedField.querySelector('input')).to.exist;
    expect(deletedField.querySelector('input').value).to.equal(deletedValue);
  });
});

/**
 * @param {Mocha.Context} testCase
 */
async function renderComponent(testCase) {
  if (!testCase.get('spacePrivileges')) {
    testCase.set('spacePrivileges', {
      viewArchives: true,
    });
  }
  const space = {
    privileges: testCase.get('spacePrivileges'),
  };
  const viewModel = ArchivePropertiesViewModel.create({
    ownerSource: testCase.owner,
    space,
    browsableArchive: testCase.get('browsableArchive'),
  });
  testCase.set('viewModel', viewModel);
  await render(hbs `
    {{#one-pseudo-modal id="pseudo-modal-id" as |modal|}}
      {{archive-properties viewModel=viewModel}}
    {{/one-pseudo-modal}}
  `);
}

/**
 * @param {Mocha.Context} testCase
 */
function whenInEditMode(testCase) {
  testCase.set('spacePrivileges', {
    manageDatasets: true,
    createArchives: true,
  });
}
