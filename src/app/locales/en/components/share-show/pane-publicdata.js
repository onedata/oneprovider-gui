import { MetadataType } from 'oneprovider-gui/models/handle';

export const handleServiceTextMore =
  'Handle service is used as a mediator to register a persistent identifier for your data collection. Handle services are typically configured by the managers in your organization or a Onezone admin, who can add members (users or groups) and grant them the privileges to publish new records.';

export const noHandleServicesText =
  'You do not have access to any handle service, which is necessary to register Public Data records. You can either create a new handle service (requires <code>oz_handle_services_create</code> admin privilege) or request access to an existing handle service from the site administrators.';

export default {
  publishWelcome: {
    title: 'Expose as Public Data',
    content: '<p>This shared data collection can be converted to a Public Data record. To do so, you must have access to a handle service, which is typically configured by the managers in your organization or a Onezone admin.</p><p>Upon conversion, the record will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Public Data indexes via the OAI PMH protocol. This process will make your data collection globally and publicly available; anyone will be able to find it in Public Data indexes. To make it findable and comprehensible, in the next step provide as much information as possible in the metadata that will be attached to this record.</p>',
    selectHandleServicePlaceholder: 'Choose a handle service...',
    selectMetadataTypePlaceholder: 'Choose a metadata type...',
    handleServiceText: 'Choose the handle service that will register the record and provide the public identifier',
    handleServiceTextMore,
    metadataTypeText: 'Choose the metadata type for the record',
    metadataTypeMore: {
      intro: 'Metadata provides detailed information about the Public Data record for its consumers and is used for indexing in Public Data search engines. Onedata supports the following metadata formats:',
      dublinCore: '<strong>Dublin Core (DC)</strong> – an open, interchangeable metadata standard for describing online resources; it is developed by the Dublin Core Metadata Initiative.',
      edm: '<strong>Europeana Data Model (EDM)</strong> – a standardized data model developed by Europeana, the European digital library; provides a comprehensive and semantically rich framework for describing cultural heritage resources.',
      dataCite: '<strong>DataCite</strong> – a metadata standard maintained by The Metadata Working Group in cooperation with the DataCite organization; designed for an accurate and consistent identification of a resource citation and retrieval purposes.',
      outro: 'The metadata will be registered alongside the persistent identifier and visible in Public Data indexing services.',
    },
    metadataTypes: {
      [MetadataType.DublinCore]: 'Dublin Core',
      [MetadataType.Edm]: 'Europeana Data Model',
      [MetadataType.DataCite]: 'DataCite',
    },
    publishButton: 'Proceed',
    selectHandleAndTypeFirst: 'Select handle service and metadata type first',
  },
  noHandleServices: {
    title: 'No handle services available',
    content: noHandleServicesText,
  },
  modifyingMetadata: 'modifying the metadata',
  exposingMetadata: 'exposing the metadata',
};
