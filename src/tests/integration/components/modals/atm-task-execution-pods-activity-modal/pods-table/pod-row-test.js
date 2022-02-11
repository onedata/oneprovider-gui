import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';
import moment from 'moment';

describe('Integration | Component | modals/atm task execution pods activity modal/pods table/pod row', function () {
  setupComponentTest('modals/atm-task-execution-pods-activity-modal/pods-table/pod-row', {
    integration: true,
  });

  beforeEach(function () {
    this.set('onSelect', sinon.spy());
  });

  it('has class "pods-table-pod-row"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('pods-table-pod-row')
      .and.to.have.length(1);
  });

  it('has "data-pod-id" attribute equal to pod id', async function () {
    const podId = this.set('podId', 'abcd');

    await render(this);

    expect(this.$('.pods-table-pod-row')).to.have.attr('data-pod-id', podId);
  });

  it('shows pod activity info', async function () {
    const {
      podId,
      podActivity,
    } = this.setProperties({
      podId: 'abcd',
      podActivity: {
        currentStatus: 'active',
        currentContainersReadiness: '1/1',
        lastStatusChangeTimestamp: 1638360000 * 1000, // 12:00:00 01.12.2021
      },
    });
    await render(this);

    expect(this.$('.pod-id').text().trim()).to.equal(podId);
    expect(this.$('.pod-readiness').text().trim())
      .to.equal(podActivity.currentContainersReadiness);
    expect(this.$('.pod-status').text().trim()).to.equal(podActivity.currentStatus);
    expect(this.$('.pod-status-since').text().trim()).to.equal(
      moment(podActivity.lastStatusChangeTimestamp).format('D MMM YYYY H:mm:ss')
    );
  });

  it('notifies about selection after click', async function () {
    const onSelect = this.get('onSelect');
    const podId = this.set('podId', 'abcd');
    await render(this);
    expect(onSelect).to.be.not.called;

    await click('.pods-table-pod-row');
    expect(onSelect).to.be.calledOnce.and.to.be.calledWith(podId);
  });

  it('shows state of selection using "is-selected" class', async function () {
    await render(this);

    this.set('isSelected', false);
    await wait();
    expect(this.$('.pods-table-pod-row')).to.not.have.class('is-selected');

    this.set('isSelected', true);
    await wait();
    expect(this.$('.pods-table-pod-row')).to.have.class('is-selected');
  });
});

async function render(testCase) {
  testCase.render(hbs `{{modals/atm-task-execution-pods-activity-modal/pods-table/pod-row
    podId=podId
    podActivity=podActivity
    isSelected=isSelected
    onSelect=onSelect
  }}`);
  await wait();
}
