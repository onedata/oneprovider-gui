const headerTooltipBeginning =
  '<p>Transfer events triggered by the QoS requirement from the point of view of current Oneprovider (<strong>{{currentProviderName}}</strong>). The log entries are collected independently by each Oneprovider supporting the space and concern only <strong>incoming</strong> data transfers.</p>';

export default {
  header: 'Synchronization audit log',
  headerTooltip: {
    singleProvider: headerTooltipBeginning,
    manyProviders: `${headerTooltipBeginning}<p>In order to view audit log for a different Oneprovider, switch to a different one in top menu of the Data view.</p>`,
  },
};
