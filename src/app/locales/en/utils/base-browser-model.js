export default {
  refreshingFailed: 'Refreshing items list failed: {{errorText}}.',
  unknownError: 'unknown error',
  fileActions: {
    refresh: 'Refresh',
  },
  refreshTip: {
    enabled: '<p>Up-to-date – the list is automatically refreshed every {{pollingIntervalSecs}} seconds.</p><p>Use this button to trigger an extra refresh at any time.</p>',
    lastError: '<p>Auto-refresh is disabled due to error that occured on last list load (<em>{{errorText}}</em>).</p><p>This button will trigger a forced refresh.</p>',
    selectedDisabled: '<p>You are viewing the listing from {{lastRefreshTime}}. Auto-refresh is disabled as long as your selection contains items falling outside of the displayed range.</p><p>This button will trigger a refresh, but your current selection may be lost.</p>',
  },
};
