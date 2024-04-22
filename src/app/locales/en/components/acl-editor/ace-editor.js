export default {
  aceType: 'Type',
  aceTypes: {
    allow: 'Allow',
    deny: 'Deny',
  },
  acePermissionState: {
    deny: 'denied',
    allow: 'allowed',
  },
  moveDown: 'Move down',
  moveUp: 'Move up',
  remove: 'Remove',
  unknown: 'Unknown',
  id: 'ID',
  aceSubjects: {
    user: 'user',
    group: 'group',
  },
  aceNotAccessible: 'This Access Control Entry refers to a {{subject}} that is no longer a member of this space.',
  noRulesEnabled: 'Select at least one operation',
  noRulesEnabledReadonly: 'This entry has no effect',
  noRulesEnabledTip: 'An entry that does not allow or deny anything is pointless — it will not impact the permissions for this principal in any way.',
};
