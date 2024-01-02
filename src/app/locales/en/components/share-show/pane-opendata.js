import { MetadataType } from 'oneprovider-gui/models/handle';

export default {
  publishWelcome: {
    title: 'Publish as Open Data',
    content: '<p>This shared data collection can be converted to an Open Data record. To do so, you must have access to an Open Data handle service, which is typically configured by the managers in your organization or a Onezone admin.</p><p>Upon conversion, the record will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via the OAI PMH protocol. This process will make your data collection globally and publicly available; anyone will be able to find it in Open Data indexes. To make it findable and comprehensible, in the next step provide as much information as possible in the metadata that will be attached to this record.</p>',
    selectHandleServicePlaceholder: 'Choose a handle service...',
    selectMetadataTypePlaceholder: 'Choose a metadata type...',
    handleServiceText: 'Choose the handle service that will register the record and provide the public identifier',
    handleServiceTextMore: 'Handle service is used as a mediator to register a persistent identifier for your data collection. Handle services are typically configured by the managers in your organization or a Onezone admin, who can add members (users or groups) and grant them the privileges to publish new records.',
    metadataTypeText: 'Choose the metadata type for the record',
    metadataTypeMore: {
      // FIXME: nowy tekst, użyte "handle"
      intro: 'Handle metadata provides detailed information about the Open Data record for its consumers and is used for indexing in Open Data search engines. Onedata supports expressing the metadata in the following formats:',
      dublinCore: '<strong>Dublin Core (DC)</strong> – an open, interchangeable metadata standard for describing online resources; it is developed by the Dublin Core Metadata Initiative,',
      edm: '<strong>Europeana Data Model (EDM)</strong> – a standardized data model developed by Europeana, the European digital library; provides a comprehensive and semantically rich framework for describing cultural heritage resources.',
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
    // FIXME: użyte "Open Data handles"
    content: 'You do not have access to any handle service, which is necessary to register Open Data handles. You can either create a new handle service (requires <code>oz_handle_services_create</code> admin privilege), or contact the site administrators and ask for access to an existing handle service.',
  },
  noMetadata: 'This dataset has no metadata attached.',
};
