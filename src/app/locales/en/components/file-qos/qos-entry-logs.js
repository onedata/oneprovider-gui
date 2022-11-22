const headerTooltipBeginning =
  '<p>A log of system events concerning replica reconciliation in the context of this QoS requirement. These logs are collected independently by each Oneprovider supporting the space and involve only its local replicas.</p>';

export default {
  header: 'Audit log',
  headerTooltip: {
    singleProvider: headerTooltipBeginning,
    manyProviders: `${headerTooltipBeginning}<p>In order to view the audit log for a different Oneprovider, switch to a different one in the top menu of the Data view.</p>`,
  },
  noEntries: 'No system events concerning replica reconciliation have occurred for this Oneprovider.',
  customColumns: {
    file: 'File',
    event: 'Event',
  },
  cellContentMessage: {
    unknownReason: 'unknown reason',
    failed: 'Failed to reconcile local replica:',
  },
};
