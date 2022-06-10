import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import moment from 'moment';

describe('Integration | Component | modals/atm task execution pods activity modal/pods table/pod row', function () {
  setupRenderingTest();

  beforeEach(function () {
    this.set('onSelect', sinon.spy());
  });

  it('has class "pods-table-pod-row"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('pods-table-pod-row');
  });

  it('has "data-pod-id" attribute equal to pod id', async function () {
    const podId = this.set('podId', 'abcd');

    await renderComponent();

    expect(find('.pods-table-pod-row')).to.have.attr('data-pod-id', podId);
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
    await renderComponent();

    expect(find('.pod-id')).to.have.trimmed.text(podId);
    expect(find('.pod-readiness'))
      .to.have.trimmed.text(podActivity.currentContainersReadiness);
    expect(find('.pod-status')).to.have.trimmed.text(podActivity.currentStatus);
    expect(find('.pod-status-since')).to.have.trimmed.text(
      moment(podActivity.lastStatusChangeTimestamp).format('D MMM YYYY H:mm:ss')
    );
  });

  it('notifies about selection after click', async function () {
    const onSelect = this.get('onSelect');
    const podId = this.set('podId', 'abcd');
    await renderComponent();
    expect(onSelect).to.be.not.called;

    await click('.pods-table-pod-row');
    expect(onSelect).to.be.calledOnce.and.to.be.calledWith(podId);
  });

  it('shows state of selection using "is-selected" class', async function () {
    await renderComponent();

    this.set('isSelected', false);
    await wait();
    expect(find('.pods-table-pod-row')).to.not.have.class('is-selected');

    this.set('isSelected', true);
    await wait();
    expect(find('.pods-table-pod-row')).to.have.class('is-selected');
  });
});

async function renderComponent() {
  await render(hbs `{{modals/atm-task-execution-pods-activity-modal/pods-table/pod-row
    podId=podId
    podActivity=podActivity
    isSelected=isSelected
    onSelect=onSelect
  }}`);
}
