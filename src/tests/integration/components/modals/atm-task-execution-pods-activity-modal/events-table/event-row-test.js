import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import wait from 'ember-test-helpers/wait';
import { click } from 'ember-native-dom-helpers';
import sinon from 'sinon';

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
      content: { type, reason, message },
    } = this.set('eventEntry', {
      timestamp: 1638360000 * 1000, // 12:00:00.000 01.12.2021
      content: {
        type: 'some type',
        reason: 'some reason',
        message: 'some message',
      },
    });
    await render(this);

    expect(this.$('.event-time').text().trim()).to.equal(
      moment(timestamp).format('D MMM YYYY H:mm:ss.SSS')
    );
    expect(this.$('.event-type').text().trim()).to.equal(type);
    expect(this.$('.event-reason').text().trim()).to.equal(reason);
    expect(this.$('.event-message').text().trim()).to.equal(message);
  });

  it('is collapsed by default', async function () {
    await render(this);

    expect(this.$('.events-table-event-row')).to.not.have.class('is-expanded');
    expect(this.$('.events-table-expanded-event-row')).to.not.exist;
  });

  it('can be expanded and collapsed', async function () {
    const {
      eventEntry: { index },
      onToggleExpand,
    } = this.setProperties({
      eventEntry: {
        index: 'abc',
      },
      isExpanded: false,
      onToggleExpand: sinon.stub().callsFake(() => {
        this.set('isExpanded', !this.get('isExpanded'));
      }),
    });
    this.set('isExpanded', false);
    await render(this);
    expect(onToggleExpand).to.be.not.called;

    await click('.events-table-event-row');
    expect(this.$('.events-table-event-row')).to.have.class('is-expanded');
    expect(this.$('.events-table-expanded-event-row')).to.exist;
    expect(onToggleExpand).to.be.calledOnce.and.to.be.calledWith(index);
    onToggleExpand.resetHistory();

    await click('.events-table-event-row');
    expect(this.$('.events-table-event-row')).to.not.have.class('is-expanded');
    expect(this.$('.events-table-expanded-event-row')).to.not.exist;
    expect(onToggleExpand).to.be.calledOnce.and.to.be.calledWith(index);
  });
});

async function render(testCase) {
  testCase.render(hbs `{{modals/atm-task-execution-pods-activity-modal/events-table/event-row
    eventEntry=eventEntry
    isExpanded=isExpanded
    onToggleExpand=onToggleExpand
  }}`);
  await wait();
}
