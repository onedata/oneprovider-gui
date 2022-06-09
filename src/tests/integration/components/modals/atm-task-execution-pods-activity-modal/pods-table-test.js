import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { click } from 'ember-native-dom-helpers';
import sinon from 'sinon';

describe('Integration | Component | modals/atm task execution pods activity modal/pods table', function () {
  setupRenderingTest();

  it('has class "pods-table"', async function () {
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('pods-table');
  });

  it('shows header and pods with filter set to "current" on init', async function () {
    this.set('activityRegistry', generateActivityRegistry());
    await renderComponent();

    expect(find('.pods-table-header-row')).to.exist;
    expect(find('.filter-current')).to.have.class('active');
    const podRows = findAll('.pods-table-pod-row');
    expect(podRows).to.have.length(2);
    expect(podRows[0]).to.contain.text('pod3').and.to.contain.text('Running');
    expect(podRows[1]).to.contain.text('pod2').and.to.contain.text('Pending');
  });

  it('allows changing pods filter to "all"', async function () {
    this.set('activityRegistry', generateActivityRegistry());
    await renderComponent();

    await click('.filter-all');

    expect(find('.filter-all')).to.have.class('active');
    const podRows = findAll('.pods-table-pod-row');
    expect(podRows).to.have.length(3);
    expect(podRows[0]).to.contain.text('pod3');
    expect(podRows[1]).to.contain.text('pod2');
    expect(podRows[2]).to.contain.text('pod1');
  });

  it('automatically changes pods filter to "all" on init when there are no pods in "current" but are some in "all"',
    async function () {
      this.set('activityRegistry', generateActivityRegistry(['Terminated', 'Terminated']));
      await renderComponent();

      expect(find('.filter-all')).to.have.class('active');
      expect(findAll('.pods-table-pod-row')).to.have.length(2);
    });

  it('shows table with pods filter equal to "current" when there are no pods',
    async function () {
      this.set('activityRegistry', generateActivityRegistry([]));
      await renderComponent();

      expect(find('.filter-current')).to.have.class('active');
      expect(findAll('.pods-table-pod-row')).to.have.length(0);
    });

  it('shows row selection', async function () {
    this.setProperties({
      activityRegistry: generateActivityRegistry(),
      selectedPodId: 'pod2',
    });
    await renderComponent();

    expect(find('[data-pod-id="pod2"]')).to.have.class('is-selected');
  });

  it('allows selecting row', async function () {
    const { onPodSelect } = this.setProperties({
      activityRegistry: generateActivityRegistry(),
      onPodSelect: sinon.spy(),
    });
    await renderComponent();
    expect(onPodSelect).to.be.not.called;

    await click('[data-pod-id="pod2"]');
    expect(onPodSelect).to.be.calledOnce.and.to.be.calledWith('pod2');
  });

  it('shows info that there are no current pods to show', async function () {
    await renderComponent();

    expect(find('.pods-table-no-pods-row'))
      .to.have.trimmed.text('There are no current pods.');
  });

  it('shows info that there are no pods to show', async function () {
    await renderComponent();
    await click('.filter-all');

    expect(find('.pods-table-no-pods-row'))
      .to.have.trimmed.text('There are no pods.');
  });
});

async function renderComponent() {
  await render(hbs `{{modals/atm-task-execution-pods-activity-modal/pods-table
    activityRegistry=activityRegistry
    selectedPodId=selectedPodId
    onPodSelect=onPodSelect
  }}`);
}

function generateActivityRegistry(statuses = ['Terminated', 'Pending', 'Running']) {
  return statuses.reduce((acc, status, idx) => {
    acc[`pod${idx + 1}`] = {
      currentStatus: status,
    };
    return acc;
  }, {});
}
