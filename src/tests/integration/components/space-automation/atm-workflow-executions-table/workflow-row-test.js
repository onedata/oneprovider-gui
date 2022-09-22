import { expect } from 'chai';
import { describe, it, before, beforeEach, afterEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import OneTooltipHelper from '../../../../helpers/one-tooltip';
import sinon from 'sinon';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
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
  name: 'resuming',
  icon: 'time',
  tooltip: 'Resuming',
}, {
  name: 'active',
  icon: 'update',
  tooltip: 'Active',
}, {
  name: 'stopping',
  icon: 'cancelled',
  tooltip: 'Stopping',
}, {
  name: 'interrupted',
  icon: 'cancelled',
  tooltip: 'Interrupted',
}, {
  name: 'paused',
  icon: 'cancelled',
  tooltip: 'Paused',
}, {
  name: 'finished',
  icon: 'checkbox-filled',
  tooltip: 'Finished',
}, {
  name: 'failed',
  icon: 'checkbox-filled-x',
  tooltip: 'Failed',
}, {
  name: 'crashed',
  icon: 'checkbox-filled-x',
  tooltip: 'Crashed',
}];

const executionActionsSpec = [{
  className: 'pause-resume-atm-workflow-execution-action-trigger',
  label: 'Pause',
  icon: 'pause',
}, {
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
const suspendTime = moment().add(3, 'h');
const timeFormat = 'D MMM YYYY H:mm:ss';

describe('Integration | Component | space automation/atm workflow executions table/workflow row', function () {
  setupRenderingTest();

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
        // It's probably not entirely correct to have both `finishTime` and
        // `suspendTime`, but for a sake of test convenience it's
        // a good simplification.
        suspendTime: suspendTime.unix(),
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
    await renderComponent();

    expect(this.element.children).to.have.length(1);
    expect(this.element.children[0]).to.have.class('workflow-row');
  });

  columns.forEach(({ name }) => {
    it(`does not show "${name}" column cell, when it is not in columns list`,
      async function () {
        const otherColumns = columns.rejectBy('name', name);
        this.set('columnNames', otherColumns.mapBy('name'));

        await renderComponent();

        const cells = findAll('.workflow-row-cell');
        expect(cells).to.have.length(otherColumns.length);
        otherColumns.forEach(({ name }, idx) =>
          expect(cells[idx]).to.have.class(`cell-${name}`)
        );
      });
  });

  it('shows workflow name in "name" column', async function () {
    this.set('columnNames', ['name']);

    await renderComponent();

    expect(find('.cell-name')).to.have.trimmed.text('workflow1');
  });

  it('shows inventory name in "inventory" column', async function () {
    this.set('columnNames', ['inventory']);

    await renderComponent();

    expect(find('.cell-inventory')).to.have.trimmed.text('inv1');
  });

  it('shows "unknown" as inventory name in "inventory" column when inventory is not available',
    async function () {
      this.set('atmWorkflowExecutionSummary.atmInventory', promiseObject(resolve(null)));
      this.set('columnNames', ['inventory']);

      await renderComponent();

      expect(find('.cell-inventory')).to.have.trimmed.text('Unknown');
    });

  [
    ['scheduledAt', 'schedule time', scheduleTime],
    ['startedAt', 'start time', startTime],
    ['finishedAt', 'finish time', finishTime],
    ['suspendedAt', 'suspend time', suspendTime],
  ].forEach(([colName, colDescription, time]) => {
    it(`shows workflow ${colDescription} in "${colName}" column`, async function () {
      this.set('columnNames', [colName]);

      await renderComponent();

      expect(find(`.cell-${colName}`)).to.have.trimmed.text(time.format(timeFormat));
    });
  });

  statuses.forEach(({ name, icon, tooltip }) => {
    it(`shows workflow "${name}" status in "status" column`, async function () {
      this.set('atmWorkflowExecutionSummary.status', name);
      this.set('columnNames', ['status']);

      await renderComponent();

      expect(find('.cell-status .one-icon')).to.have.class(`oneicon-${icon}`);
      expect(await new OneTooltipHelper('.cell-status .one-icon').getText())
        .to.equal(tooltip);
    });
  });

  it('allows to choose from workflow execution actions in actions column', async function () {
    this.set('columnNames', ['actions']);

    await renderComponent();

    const actionsTrigger =
      find('.cell-actions .atm-workflow-execution-actions-trigger');
    expect(actionsTrigger).to.exist;

    await click(actionsTrigger);

    const actions =
      document.querySelectorAll('.webui-popover.in .actions-popover-content a');
    expect(actions).to.have.length(executionActionsSpec.length);
    executionActionsSpec.forEach(({ className, label, icon }, index) => {
      const action = actions[index];
      expect(action).to.have.class(className);
      expect(action).to.have.trimmed.text(label);
      expect(action.querySelector('.one-icon')).to.have.class(`oneicon-${icon}`);
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

    await renderComponent();
    await click('.atm-workflow-execution-actions-trigger');
    await click(
      document.querySelector('.webui-popover.in .copy-record-id-action-trigger')
    );

    expect(executeStub).to.be.calledOnce;
  });

  it('calls "onSelect" when clicked', async function () {
    const {
      selectSpy,
      atmWorkflowExecutionSummary,
    } = this.getProperties('selectSpy', 'atmWorkflowExecutionSummary');
    await renderComponent();

    expect(selectSpy).to.be.not.called;
    await click('.workflow-row');

    expect(selectSpy).to.be.calledOnce
      .and.to.be.calledWith(atmWorkflowExecutionSummary);
  });
});

async function renderComponent() {
  await render(hbs `
  {{space-automation/atm-workflow-executions-table/workflow-row
    atmWorkflowExecutionSummary=atmWorkflowExecutionSummary
    columns=columnNames
    onSelect=selectSpy
  }}`);
}
