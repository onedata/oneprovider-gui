import atmWorkflowSchemasList from './space-automation/atm-workflow-schemas-list';
import inputStoresForm from './space-automation/input-stores-form';
import runWorkflowCreator from './space-automation/run-workflow-creator';
import atmWorkflowExecutionsTable from './space-automation/atm-workflow-executions-table';

export default {
  atmWorkflowSchemasList,
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
    preview: {
      tabLoadingLabel: 'Loading...',
      tabErrorLabel: 'Cannot load',
    },
    create: {
      tabLabel: 'Run workflow',
    },
  },
};
