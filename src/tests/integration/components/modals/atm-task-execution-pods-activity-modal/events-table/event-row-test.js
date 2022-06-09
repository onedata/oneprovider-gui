import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { click } from 'ember-native-dom-helpers';
import sinon from 'sinon';

describe('Integration | Component | modals/atm task execution pods activity modal/events table/event row', function () {
  setupRenderingTest();

  it('has class "events-table-event-row"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('events-table-event-row');
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
    await renderComponent();

    expect(find('.event-time')).to.have.trimmed.text(
      moment(timestamp).format('D MMM YYYY H:mm:ss')
    );
    expect(find('.event-type')).to.have.trimmed.text(type);
    expect(find('.event-reason')).to.have.trimmed.text(reason);
    expect(find('.event-message')).to.have.trimmed.text(message);
  });

  it('is collapsed by default', async function () {
    await renderComponent();

    expect(find('.events-table-event-row')).to.not.have.class('is-expanded');
    expect(find('.events-table-expanded-event-row')).to.not.exist;
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
    await renderComponent();
    expect(onToggleExpand).to.be.not.called;

    await click('.events-table-event-row');
    expect(find('.events-table-event-row')).to.have.class('is-expanded');
    expect(find('.events-table-expanded-event-row')).to.exist;
    expect(onToggleExpand).to.be.calledOnce.and.to.be.calledWith(index);
    onToggleExpand.resetHistory();

    await click('.events-table-event-row');
    expect(find('.events-table-event-row')).to.not.have.class('is-expanded');
    expect(find('.events-table-expanded-event-row')).to.not.exist;
    expect(onToggleExpand).to.be.calledOnce.and.to.be.calledWith(index);
  });
});

async function renderComponent() {
  await render(hbs `{{modals/atm-task-execution-pods-activity-modal/events-table/event-row
    eventEntry=eventEntry
    isExpanded=isExpanded
    onToggleExpand=onToggleExpand
  }}`);
}
