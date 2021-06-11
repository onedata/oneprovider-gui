import inputStoresForm from './space-automation/input-stores-form';
import runWorkflowCreator from './space-automation/run-workflow-creator';
import atmWorkflowExecutionsTable from './space-automation/atm-workflow-executions-table';

export default {
  inputStoresForm,
  runWorkflowCreator,
  atmWorkflowExecutionsTable,
  tabs: {
    waiting: {
      tabLabel: 'Waiting',
    },
    ongoing: {
      tabLabel: 'Ongoing',
    },
    ended: {
      tabLabel: 'Ended',
    },
    create: {
      tabLabel: 'Run workflow',
    },
  },
};
