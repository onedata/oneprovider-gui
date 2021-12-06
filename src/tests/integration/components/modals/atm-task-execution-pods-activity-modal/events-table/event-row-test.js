import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import wait from 'ember-test-helpers/wait';

describe('Integration | Component | modals/atm task execution pods activity modal/events table/event row', function () {
  setupComponentTest('modals/atm-task-execution-pods-activity-modal/events-table/event-row', {
    integration: true,
  });

  it('has class "events-table-event-row"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('events-table-event-row')
      .and.to.have.length(1);
  });

  it('shows event info', async function () {
    const {
      timestamp,
      payload: { type, reason, message },
    } = this.set('eventData', {
      timestamp: 1638360000, // 12:00:00 01.12.2021
      payload: {
        type: 'some type',
        reason: 'some reason',
        message: 'some message',
      },
    });
    await render(this);

    expect(this.$('.event-time').text().trim()).to.equal(
      moment.unix(timestamp).format('D MMM YYYY H:mm:ss')
    );
    expect(this.$('.event-type').text().trim()).to.equal(type);
    expect(this.$('.event-reason').text().trim()).to.equal(reason);
    expect(this.$('.event-message').text().trim()).to.equal(message);
  });
});

async function render(testCase) {
  testCase.render(hbs `{{modals/atm-task-execution-pods-activity-modal/events-table/event-row
    eventData=eventData
  }}`);
  await wait();
}
