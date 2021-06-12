import workflowRow from './atm-workflow-executions-table/workflow-row';

export default {
  columns: {
    name: 'Name',
    scheduledAt: 'Scheduled at',
    startedAt: 'Started at',
    finishedAt: 'Finished at',
    status: 'Status',
  },
  noAtmWorkflowExecutions: {
    waiting: 'There are no waiting workflow executions',
    ongoing: 'There are no ongoing workflow executions',
    ended: 'There are no ended workflow executions',
  },
  workflowRow,
};
