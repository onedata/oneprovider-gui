import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { find } from 'ember-native-dom-helpers';
import {
  getBrowsableArchiveName,
  createArchive,
  createDataset,
} from '../../helpers/datasets-archives';
import { run } from '@ember/runloop';

describe('Integration | Component | archive settings', function () {
  setupComponentTest('archive-properties', {
    integration: true,
  });

  beforeEach(async function () {
    await run(() => createDataset(this));
    await run(() => createArchive(this));
  });

  it('renders "Archive properties" text and archive name in header', async function () {
    const name = await getBrowsableArchiveName(this);

    await renderComponent(this);

    const header = find('.archive-properties-modal-header');
    expect(header).to.exist;
    expect(header.textContent).to.contain('Archive properties');
    expect(header.textContent).to.contain(name);
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

async function renderComponent(testCase) {
  if (!testCase.get('spacePrivileges')) {
    testCase.set('spacePrivileges', {
      viewArchives: true,
    });
  }
  testCase.render(hbs `
    {{#one-pseudo-modal id="pseudo-modal-id" as |modal|}}
      {{archive-properties
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

function whenInEditMode(testCase) {
  testCase.set('spacePrivileges', {
    manageDatasets: true,
    createArchives: true,
  });
}
