import { MetadataType } from 'oneprovider-gui/models/handle';

export const handleServiceTextMore =
  'Handle service is used as a mediator to register a persistent identifier for your data collection. Handle services are typically configured by the managers in your organization or a Onezone admin, who can add members (users or groups) and grant them the privileges to publish new records.';

export const noHandleServicesText =
  'You do not have access to any Open Data handle service, which is necessary to register Open Data records. You can either create a new handle service (requires <code>oz_handle_services_create</code> admin privilege) or request access to an existing handle service from the site administrators.';

export default {
  publishWelcome: {
    title: 'Publish as Open Data',
    content: '<p>This shared data collection can be converted to an Open Data record. To do so, you must have access to an Open Data handle service, which is typically configured by the managers in your organization or a Onezone admin.</p><p>Upon conversion, the record will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via the OAI PMH protocol. This process will make your data collection globally and publicly available; anyone will be able to find it in Open Data indexes. To make it findable and comprehensible, in the next step provide as much information as possible in the metadata that will be attached to this record.</p>',
    selectHandleServicePlaceholder: 'Choose a handle service...',
    selectMetadataTypePlaceholder: 'Choose a metadata type...',
    handleServiceText: 'Choose the handle service that will register the record and provide the public identifier',
    handleServiceTextMore,
    metadataTypeText: 'Choose the metadata type for the record',
    metadataTypeMore: {
      // TODO: VFS-11983 Revert the commit after 1be5aa28c86a765a6de1433289cc969bd6b6163b — to revert text for multiple metadata formats
      intro: 'Metadata provides detailed information about the Open Data record for its consumers and is used for indexing in Open Data search engines. Onedata supports the following metadata format:',
      dublinCore: '<strong>Dublin Core (DC)</strong> – an open, interchangeable metadata standard for describing online resources; it is developed by the Dublin Core Metadata Initiative.',
      // TODO: VFS-11983 Revert the commit after 1be5aa28c86a765a6de1433289cc969bd6b6163b — to revert text for multiple metadata formats
      // edm: '<strong>Europeana Data Model (EDM)</strong> – a standardized data model developed by Europeana, the European digital library; provides a comprehensive and semantically rich framework for describing cultural heritage resources.',
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
    content: noHandleServicesText,
  },
};
