import { MetadataType } from 'oneprovider-gui/models/handle';

export default {
  publishWelcome: {
    title: 'Publish as Open Data',
    content: 'You can register this shared dataset in a handle service – it will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via OAI PMH protocol. This process will make your dataset globally available (without an account in Onedata) and anyone will be able to search for it in the Open Data indexes. To make it easily searchable for, in the next step you should provide as much information as possible in the Dublin Core metadata that will be attached to this dataset.',
    selectHandleServicePlaceholder: 'Choose a handle service...',
    selectMetadataTypePlaceholder: 'Choose a metadata type...',
    handleServiceText: 'Choose the handle service in which you wish to register the handle.',
    handleServiceTextMore: 'Handle service is used as a mediator to register a handle for your dataset in an Open Data index. Handle services are typically configured by Onezone admins, who can add members (users and groups) that will have access to the handle service and rights to publish new handles.',
    metadataTypeText: 'Choose the handle metadata type you want to use.',
    metadataTypeMore: {
      intro: 'Handle metadata provides detailed information about the dataset for its consumers and is used to index the dataset in Open Data search engines. Onedata supports expressing the metadata in the following unified formats:',
      dublinCore: '<strong>Dublin Core</strong> – an open, interchangeable metadata standard for describing online resources; it is developed by the Dublin Core Metadata Initiative,',
      edm: '<strong>Europeana Data Model</strong> – a standardized data model developed by Europeana, the European digital library; provides a comprehensive and semantically rich framework for describing cultural heritage resources.',
      outro: 'The metadata will be registered alongside the persistent identifier and visible in Open Data indexing services.',
    },
    metadataTypes: {
      [MetadataType.Dc]: 'Dublin Core',
      [MetadataType.Edm]: 'Europeana Data Model',
    },
    publishButton: 'Proceed',

  },
  noHandleServices: {
    title: 'No handle services available',
    content: 'You do not have access to any handle service, which is necessary to register Open Data handles. You can either create a new handle service (requires <code>oz_handle_services_create</code> admin privilege), or contact the site administrators and ask for access to an existing handle service.',
  },
};
