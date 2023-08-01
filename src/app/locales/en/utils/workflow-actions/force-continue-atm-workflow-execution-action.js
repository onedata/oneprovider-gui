export default {
  title: 'Force continue',
  successNotificationText: 'Workflow has been successfully scheduled for continuation.',
  failureNotificationActionName: 'workflow continuation scheduling',
  disabledTip: {
    onlyFailedExecution: 'Only failed workflow executions can be continued.',
    onlyForNonLastLane: 'Workflow execution cannot be continued if it failed during the last lane processing.',
  },
};
