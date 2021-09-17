import { expect } from 'chai';
import { describe, it, before, beforeEach, afterEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import moment from 'moment';
import OneTooltipHelper from '../../../../helpers/one-tooltip';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import $ from 'jquery';
import CopyRecordIdAction from 'onedata-gui-common/utils/clipboard-actions/copy-record-id-action';

const columns = [{
  name: 'name',
}, {
  name: 'inventory',
}, {
  name: 'scheduledAt',
}, {
  name: 'startedAt',
}, {
  name: 'finishedAt',
}, {
  name: 'status',
}];

const statuses = [{
  name: 'scheduled',
  icon: 'time',
  tooltip: 'Scheduled',
}, {
  name: 'preparing',
  icon: 'time',
  tooltip: 'Preparing',
}, {
  name: 'enqueued',
  icon: 'time',
  tooltip: 'Enqueued',
}, {
  name: 'active',
  icon: 'update',
  tooltip: 'Active',
}, {
  name: 'finished',
  icon: 'checkbox-filled',
  tooltip: 'Finished',
}, {
  name: 'failed',
  icon: 'checkbox-filled-x',
  tooltip: 'Failed',
}];

const executionActionsSpec = [{
  className: 'cancel-atm-workflow-execution-action-trigger',
  label: 'Cancel',
  icon: 'cancelled',
}, {
  className: 'copy-record-id-action-trigger',
  label: 'Copy ID',
  icon: 'copy',
}];

const scheduleTime = moment();
const startTime = moment().add(1, 'h');
const finishTime = moment().add(2, 'h');
const timeFormat = 'D MMM YYYY H:mm:ss';

describe('Integration | Component | space automation/atm workflow executions table/workflow row', function () {
  setupComponentTest('space-automation/atm-workflow-executions-table/workflow-row', {
    integration: true,
  });

  before(function () {
    // Instatiate Action class to make its `prototype.execute` available for
    // mocking.
    CopyRecordIdAction.create();
  });

  beforeEach(function () {
    this.setProperties({
      atmWorkflowExecutionSummary: {
        constructor: {
          modelName: 'atm-workflow-execution-summary',
        },
        name: 'workflow1',
        scheduleTime: scheduleTime.unix(),
        startTime: startTime.unix(),
        finishTime: finishTime.unix(),
        atmInventory: promiseObject(resolve({
          name: 'inv1',
        })),
      },
      selectSpy: sinon.spy(),
    });
  });

  afterEach(function () {
    // Reset stubbed action
    if (CopyRecordIdAction.prototype.execute.restore) {
      CopyRecordIdAction.prototype.execute.restore();
    }
  });

  it('has class "workflow-row"', async function () {
    await render(this);

    expect(this.$().children()).to.have.class('workflow-row')
      .and.to.have.length(1);
  });

  columns.forEach(({ name }) => {
    it(`does not show "${name}" column cell, when it is not in columns list`,
      async function () {
        const otherColumns = columns.rejectBy('name', name);
        this.set('columnNames', otherColumns.mapBy('name'));

        await render(this);

        const $cells = this.$('.workflow-row-cell');
        expect($cells).to.have.length(otherColumns.length);
        otherColumns.forEach(({ name }, idx) =>
          expect($cells.eq(idx)).to.have.class(`cell-${name}`)
        );
      });
  });

  it('shows workflow name in "name" column', async function () {
    this.set('columnNames', ['name']);

    await render(this);

    expect(this.$('.cell-name').text().trim()).to.equal('workflow1');
  });

  it('shows inventory name in "inventory" column', async function () {
    this.set('columnNames', ['inventory']);

    await render(this);

    expect(this.$('.cell-inventory').text().trim()).to.equal('inv1');
  });

  it('shows "unknown" as inventory name in "inventory" column when inventory is not available',
    async function () {
      this.set('atmWorkflowExecutionSummary.atmInventory', promiseObject(resolve(null)));
      this.set('columnNames', ['inventory']);

      await render(this);

      expect(this.$('.cell-inventory').text().trim()).to.equal('Unknown');
    });

  [
    ['scheduledAt', 'schedule time', scheduleTime],
    ['startedAt', 'start time', startTime],
    ['finishedAt', 'finish time', finishTime],
  ].forEach(([colName, colDescription, time]) => {
    it(`shows workflow ${colDescription} in "${colName}" column`, async function () {
      this.set('columnNames', [colName]);

      await render(this);

      expect(this.$(`.cell-${colName}`).text().trim()).to.equal(time.format(timeFormat));
    });
  });

  statuses.forEach(({ name, icon, tooltip }) => {
    it(`shows workflow "${name}" status in "status" column`, async function () {
      this.set('atmWorkflowExecutionSummary.status', name);
      this.set('columnNames', ['status']);

      await render(this);

      expect(this.$('.cell-status .one-icon')).to.have.class(`oneicon-${icon}`);
      expect(await new OneTooltipHelper('.cell-status .one-icon').getText())
        .to.equal(tooltip);
    });
  });

  it('allows to choose from workflow execution actions in actions column', async function () {
    this.set('columnNames', ['actions']);

    await render(this);

    const $actionsTrigger =
      this.$('.cell-actions .atm-workflow-execution-actions-trigger');
    expect($actionsTrigger).to.exist;

    await click($actionsTrigger[0]);

    const $actions = $('body .webui-popover.in .actions-popover-content a');
    expect($actions).to.have.length(executionActionsSpec.length);
    executionActionsSpec.forEach(({ className, label, icon }, index) => {
      const $action = $actions.eq(index);
      expect($action).to.have.class(className);
      expect($action.text().trim()).to.equal(label);
      expect($action.find('.one-icon')).to.have.class(`oneicon-${icon}`);
    });
  });

  it('allows to copy workflow execution ID', async function () {
    this.set('columnNames', ['actions']);
    const atmWorkflowExecutionSummary = this.get('atmWorkflowExecutionSummary');
    const executeStub = sinon.stub(
      CopyRecordIdAction.prototype,
      'execute'
    ).callsFake(function () {
      expect(this.get('context.record')).to.equal(atmWorkflowExecutionSummary);
      return resolve({ status: 'done' });
    });

    await render(this);
    await click('.atm-workflow-execution-actions-trigger');
    await click(
      $('body .webui-popover.in .copy-record-id-action-trigger')[0]
    );

    expect(executeStub).to.be.calledOnce;
  });

  it('calls "onSelect" when clicked', async function () {
    const {
      selectSpy,
      atmWorkflowExecutionSummary,
    } = this.getProperties('selectSpy', 'atmWorkflowExecutionSummary');
    await render(this);

    expect(selectSpy).to.be.not.called;
    await click('.workflow-row');

    expect(selectSpy).to.be.calledOnce
      .and.to.be.calledWith(atmWorkflowExecutionSummary);
  });
});

async function render(testCase) {
  testCase.render(hbs `
  {{space-automation/atm-workflow-executions-table/workflow-row
    atmWorkflowExecutionSummary=atmWorkflowExecutionSummary
    columns=columnNames
    onSelect=selectSpy
  }}`);
  await wait();
}
