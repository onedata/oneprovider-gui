import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { click } from 'ember-native-dom-helpers';
import sinon from 'sinon';

describe('Integration | Component | modals/atm task execution pods activity modal/pods table', function () {
  setupComponentTest('modals/atm-task-execution-pods-activity-modal/pods-table', {
    integration: true,
  });

  it('has class "pods-table"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('pods-table').and.to.have.length(1);
  });

  it('shows header and pods with filter set to "current" on init', async function () {
    this.set('activityRegistry', generateActivityRegistry());
    await render(this);

    expect(this.$('.pods-table-header-row')).to.exist;
    expect(this.$('.filter-current')).to.have.class('active');
    const $podRows = this.$('.pods-table-pod-row');
    expect($podRows).to.have.length(2);
    expect($podRows.eq(0).text()).to.contain('pod3').and.to.contain('Running');
    expect($podRows.eq(1).text()).to.contain('pod2').and.to.contain('Pending');
  });

  it('allows changing pods filter to "all"', async function () {
    this.set('activityRegistry', generateActivityRegistry());
    await render(this);

    await click('.filter-all');

    expect(this.$('.filter-all')).to.have.class('active');
    const $podRows = this.$('.pods-table-pod-row');
    expect($podRows).to.have.length(3);
    expect($podRows.eq(0).text()).to.contain('pod3');
    expect($podRows.eq(1).text()).to.contain('pod2');
    expect($podRows.eq(2).text()).to.contain('pod1');
  });

  it('shows row selection', async function () {
    this.setProperties({
      activityRegistry: generateActivityRegistry(),
      selectedPodId: 'pod2',
    });
    await render(this);

    expect(this.$('[data-pod-id="pod2"]')).to.have.class('is-selected');
  });

  it('allows selecting row', async function () {
    const { onPodSelect } = this.setProperties({
      activityRegistry: generateActivityRegistry(),
      onPodSelect: sinon.spy(),
    });
    await render(this);
    expect(onPodSelect).to.be.not.called;

    await click('[data-pod-id="pod2"]');
    expect(onPodSelect).to.be.calledOnce.and.to.be.calledWith('pod2');
  });

  it('shows info that there are no current pods to show', async function () {
    await render(this);

    expect(this.$('.pods-table-no-pods-row').text().trim())
      .to.equal('There are no current pods.');
  });

  it('shows info that there are no pods to show', async function () {
    await render(this);
    await click('.filter-all');

    expect(this.$('.pods-table-no-pods-row').text().trim())
      .to.equal('There are no pods.');
  });
});

async function render(testCase) {
  testCase.render(hbs `{{modals/atm-task-execution-pods-activity-modal/pods-table
    activityRegistry=activityRegistry
    selectedPodId=selectedPodId
    onPodSelect=onPodSelect
  }}`);
  await wait();
}

function generateActivityRegistry() {
  return {
    pod1: {
      currentStatus: 'Succeeded',
    },
    pod2: {
      currentStatus: 'Pending',
    },
    pod3: {
      currentStatus: 'Running',
    },
  };
}
