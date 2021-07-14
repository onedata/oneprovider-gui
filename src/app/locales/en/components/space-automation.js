import atmWorkflowSchemasList from './space-automation/atm-workflow-schemas-list';
import inputStoresForm from './space-automation/input-stores-form';
import runWorkflowCreator from './space-automation/run-workflow-creator';
import atmWorkflowExecutionsTable from './space-automation/atm-workflow-executions-table';
import atmWorkflowExecutionPreview from './space-automation/atm-workflow-execution-preview';

export default {
  atmWorkflowSchemasList,
  inputStoresForm,
  runWorkflowCreator,
  atmWorkflowExecutionsTable,
  atmWorkflowExecutionPreview,
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
