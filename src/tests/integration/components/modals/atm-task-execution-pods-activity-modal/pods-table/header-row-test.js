import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';

describe('Integration | Component | modals/atm task execution pods activity modal/pods table/header row', function () {
  setupRenderingTest();

  beforeEach(function () {
    // Using stub because spy does not have `resetHistory` method.
    this.set('onPodsFilterChange', sinon.stub());
  });

  it('has class "pods-table-header-row"', async function () {
    await renderComponent();

    expect(this.$().children()).to.have.class('pods-table-header-row')
      .and.to.have.length(1);
  });

  it('shows labels of columns', async function () {
    await renderComponent();

    const $labels = this.$('.column-label-text');
    [
      'Pod name',
      'Readiness',
      'Status',
      'Status since',
    ].forEach((colLabel, idx) =>
      expect($labels.eq(idx).text().trim()).to.equal(colLabel)
    );
  });

  it('shows filtering buttons and filtering state', async function () {
    this.setProperties({
      allPodsCount: 3,
      currentPodsCount: 2,
    });
    await renderComponent();

    [
      { name: 'current', label: 'Current (2)' },
      { name: 'all', label: 'All (3)' },
    ].forEach(({ name, label }) =>
      expect(this.$(`.filter-${name}`).text().trim()).to.equal(label)
    );

    this.set('podsFilter', 'current');
    await wait();
    expect(this.$('.filter-current')).to.have.class('active');

    this.set('podsFilter', 'all');
    await wait();
    expect(this.$('.filter-all')).to.have.class('active');
  });

  it('allows changing filter', async function () {
    const onPodsFilterChange = this.get('onPodsFilterChange');
    await renderComponent();
    expect(onPodsFilterChange).to.be.not.called;

    await click('.filter-current');
    expect(onPodsFilterChange).to.be.calledOnce.and.to.be.calledWith('current');
    onPodsFilterChange.resetHistory();

    await click('.filter-all');
    expect(onPodsFilterChange).to.be.calledOnce.and.to.be.calledWith('all');
  });
});

async function renderComponent() {
  await render(hbs `{{modals/atm-task-execution-pods-activity-modal/pods-table/header-row
    allPodsCount=allPodsCount
    currentPodsCount=currentPodsCount
    podsFilter=podsFilter
    onPodsFilterChange=onPodsFilterChange
  }}`);
}
