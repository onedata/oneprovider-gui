import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | modals/atm task execution pods activity modal/events table/header row',
  function () {
    setupRenderingTest();

    it('has class "events-table-header-row"', async function () {
      await renderComponent();

      expect(this.element.children).to.have.length(1);
      expect(this.element.children[0]).to.have.class('events-table-header-row');
    });

    it('shows labels of columns', async function () {
      await renderComponent();

      const labels = findAll('.column-label');
      [
        'Time',
        'Type',
        'Reason',
        'Message',
      ].forEach((colLabel, idx) =>
        expect(labels[idx]).to.have.trimmed.text(colLabel)
      );
    });
  });

async function renderComponent() {
  await render(hbs `{{modals/atm-task-execution-pods-activity-modal/events-table/header-row}}`);
}
