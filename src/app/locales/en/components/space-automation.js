import inputStoresForm from './space-automation/input-stores-form';
import runWorkflowCreator from './space-automation/run-workflow-creator';

export default {
  inputStoresForm,
  runWorkflowCreator,
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
