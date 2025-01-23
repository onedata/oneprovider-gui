export default {
  shareNameDoesNotMatch: {
    single: {
      shareName: 'The Share name (<strong>{{shareName}}</strong>) does not match the title specified in the EDM metadata.',
      consider: 'Consider unifying them to achieve consistent presentation in the',
      update: 'You may use the button below to quickly update the Share name to match the title (<strong>{{metadataTitle}}</strong>).',
    },
    multi: {
      shareName: 'The Share name (<strong>{{shareName}}</strong>) does not match any title specified in the EDM metadata.',
      consider: 'Consider using one of the titles as the Share name to achieve consistent presentation in the',
      adjustName: 'You may adjust the Share name using the actions menu ("three dots" at the top right).',
    },
    publicShareView: 'public Share view',
  },
  dismiss: 'Dismiss',
  applyName: 'Unify the Share name',
  settingShareName: 'setting the Share name',
};
