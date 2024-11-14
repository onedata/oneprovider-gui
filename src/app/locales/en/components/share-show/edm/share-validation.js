export default {
  shareNameDoesNotMatch: {
    single: {
      shareName: 'The share name (<strong>{{shareName}}</strong>) does not match the title specified in the EDM metadata.',
      consider: 'Consider unifying them to achieve consistent presentation in the',
      update: 'You may use the button below to quickly update the share name to match the title (<strong>{{metadataTitle}}</strong>).',
    },
    multi: {
      shareName: 'The share name (<strong>{{shareName}}</strong>) does not match any title specified in the EDM metadata.',
      consider: 'Consider using one of the titles as the share name to achieve consistent presentation in the',
      adjustName: 'You may adjust the share name using the actions menu ("three dots" at the top right).',
    },
    publicShareView: 'public share view',
  },
  dismiss: 'Dismiss',
  applyName: 'Unify the share name',
  settingShareName: 'setting the share name',
};
