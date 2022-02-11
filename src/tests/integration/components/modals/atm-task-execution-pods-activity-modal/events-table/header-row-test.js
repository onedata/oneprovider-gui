import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

describe('Integration | Component | modals/atm task execution pods activity modal/events table/header row',
  function () {
    setupComponentTest('modals/atm-task-execution-pods-activity-modal/events-table/header-row', {
      integration: true,
    });

    it('has class "events-table-header-row"', async function () {
      await render(this);

      expect(this.$().children()).to.have.class('events-table-header-row')
        .and.to.have.length(1);
    });

    it('shows labels of columns', async function () {
      await render(this);

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

async function render(testCase) {
  testCase.render(hbs `{{modals/atm-task-execution-pods-activity-modal/events-table/header-row}}`);
  await wait();
}
