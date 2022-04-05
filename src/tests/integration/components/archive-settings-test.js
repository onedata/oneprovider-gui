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
  setupComponentTest('archive-settings', {
    integration: true,
  });

  beforeEach(async function () {
    await run(() => createDataset(this));
    await run(() => createArchive(this));
  });

  it('renders "Archive properties" text and archive name in header', async function () {
    const name = await getBrowsableArchiveName(this);

    await render(this);

    const header = find('.archive-settings-modal-header');
    expect(header).to.exist;
    expect(header.textContent).to.contain('Archive properties');
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

  it('does not render callback fields in edit mode when not provided', async function () {
    whenInEditMode(this);

    await render(this);

    const preservedField = find('.preservedCallback-field');
    const purgedField = find('.purgedCallback-field');
    expect(preservedField).to.not.exist;
    expect(purgedField).to.not.exist;
  });

  it('renders callback fields in edit mode when provided', async function () {
    whenInEditMode(this);
    const archive = this.get('archive');
    const preservedValue = 'https://example.org/preserved_archives';
    const purgedValue = 'https://example.org/purged_archives';

    run(() => {
      archive.setProperties({
        preservedCallback: preservedValue,
        purgedCallback: purgedValue,
      });
    });

    await render(this);

    const preservedField = find('.preservedCallback-field');
    const purgedField = find('.purgedCallback-field');
    expect(preservedField).to.exist;
    expect(preservedField.textContent).to.contain('Preserved callback URL');
    expect(preservedField.querySelector('input')).to.exist;
    expect(preservedField.querySelector('input').value).to.equal(preservedValue);
    expect(purgedField).to.exist;
    expect(purgedField.textContent).to.contain('Purged callback URL');
    expect(purgedField.querySelector('input')).to.exist;
    expect(purgedField.querySelector('input').value).to.equal(purgedValue);
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

function whenInEditMode(testCase) {
  testCase.set('spacePrivileges', {
    manageDatasets: true,
    createArchives: true,
  });
}
