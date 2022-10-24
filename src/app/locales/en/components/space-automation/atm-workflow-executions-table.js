import workflowRow from './atm-workflow-executions-table/workflow-row';

export default {
  columns: {
    name: 'Name',
    inventory: 'Inventory',
    scheduledAt: 'Scheduled at',
    startedAt: 'Started at',
    finishedAt: 'Finished at',
    suspendedAt: 'Suspended at',
    status: 'Status',
    actions: '',
  },
  noAtmWorkflowExecutions: {
    waiting: 'There are no waiting workflow executions',
    ongoing: 'There are no ongoing workflow executions',
    ended: 'There are no ended workflow executions',
    suspended: 'There are no suspended workflow executions',
  },
  workflowRow,
};
