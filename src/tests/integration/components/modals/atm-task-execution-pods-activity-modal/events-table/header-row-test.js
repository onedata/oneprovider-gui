import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | modals/atm task execution pods activity modal/events table/header row',
  function () {
    setupRenderingTest();

    it('has class "events-table-header-row"', async function () {
      await renderComponent();

      expect(this.$().children()).to.have.class('events-table-header-row')
        .and.to.have.length(1);
    });

    it('shows labels of columns', async function () {
      await renderComponent();

      const $labels = this.$('.column-label');
      [
        'Time',
        'Type',
        'Reason',
        'Message',
      ].forEach((colLabel, idx) =>
        expect($labels.eq(idx).text().trim()).to.equal(colLabel)
      );
    });
  });

async function renderComponent() {
  await render(hbs `{{modals/atm-task-execution-pods-activity-modal/events-table/header-row}}`);
}
