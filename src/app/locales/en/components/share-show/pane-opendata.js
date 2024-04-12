export const noHandleServicesText =
  'You do not have access to any handle service, which is necessary to register Open Data records. You can either create a new handle service (requires <code>oz_handle_services_create</code> admin privilege) or request access to an existing handle service from the site administrators.';

export default {
  publishWelcome: {
    title: 'Publish as Open Data',
    content: 'You can register this shared dataset in a handle service – it will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via OAI PMH protocol. This process will make your dataset globally available (without an account in Onedata) and anyone will be able to search for it in the Open Data indexes. To make it easily searchable for, in the next step you should provide as much information as possible in the Dublin Core metadata that will be attached to this dataset.',
    selectHandleServicePlaceholder: 'Choose a handle service...',
    handleServiceText: 'Choose the handle service in which you wish to register the handle.',
    handleServiceTextMore: 'Handle service is used as a mediator to register a handle for your dataset in an Open Data index. Handle services are typically configured by Onezone admins, who can add members (users and groups) that will have access to the handle service and rights to publish new handles.',
    publishButton: 'Proceed',
  },
  noHandleServices: {
    title: 'No handle services available',
    content: noHandleServicesText,
  },
};
