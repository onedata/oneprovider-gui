import commonMockData from 'onedata-gui-common/utils/mock-data';
import EdmMetadata from './edm/metadata';
import EdmObjectFactory from './edm/object-factory';
import EdmObjectType from './edm/object-type';
import EdmPropertyFactory from './edm/property-factory';

export const exampleMarkdownShort = commonMockData.exampleMarkdownShort;

export const exampleMarkdownLong = commonMockData.exampleMarkdownLong;

export const exampleDublinCore = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
  <dc:creator>Bartosz Kryza</dc:creator>
  <dc:creator></dc:creator>
  <dc:subject>Demonstration</dc:subject>
  <dc:description>This data set contains 10 images containing white noise, including script used to generate them.</dc:description>
  <dc:date>2018-11-12</dc:date>
  <dc:language>PL</dc:language>
  <dc:format>PNG</dc:format>
  <dc:rights>CC-0</dc:rights>
  <dc:language>EN</dc:language>
</metadata>`;

export const exampleEdmMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:edm="http://www.europeana.eu/schemas/edm/"
    xmlns:ore="http://www.openarchives.org/ore/terms/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
>
    <edm:ProvidedCHO rdf:about="#exampleMet0">
        <dc:title>My share 1</dc:title>
        <dc:language>en</dc:language>
        <dc:type>dataset</dc:type>
        <edm:type>TEXT</edm:type>
        <dc:creator>Stub user</dc:creator>
        <dc:date>2023-12-20</dc:date>
    </edm:ProvidedCHO>
    <ore:Aggregation rdf:about="#exampleMet0_AGG">
        <edm:aggregatedCHO rdf:resource="#exampleMet0"/>
        <edm:dataProvider>Stub user</edm:dataProvider>
        <edm:isShownAt rdf:resource="https://onezone.local-onedata.org:9192/shares/share-space-0-1"/>
        <edm:provider>Stub user</edm:provider>
        <edm:rights rdf:resource="http://rightsstatements.org/vocab/NoC-OKLR/1.0/"/>
    </ore:Aggregation>
</rdf:RDF>`;

export const exampleDublinCoreShort = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
</metadata>`;

export const exampleDublinCoreLong = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
  <dc:creator>Bartosz Kryza</dc:creator>
  <dc:creator></dc:creator>
  <dc:subject>Demonstration</dc:subject>
  <dc:description>This data set contains 10 images containing white noise, including script used to generate them.</dc:description>
  <dc:description>Ullamco do non eiusmod cillum. Laborum incididunt aliqua pariatur ad Lorem amet consequat voluptate occaecat sint cillum aliqua ex pariatur. Dolor enim esse sit adipisicing laboris ad id occaecat sunt exercitation voluptate id nulla mollit.</dc:description>
  <dc:description>Mollit consequat amet ex deserunt mollit non minim do velit pariatur mollit. Deserunt magna fugiat laborum in. Amet cupidatat esse sunt ullamco tempor. Eu nulla in sint nisi excepteur est ad Lorem labore quis ipsum nostrud incididunt magna. Amet ea magna aliqua ut eu voluptate nisi cupidatat labore aute ullamco.</dc:description>
  <dc:date>2018-11-12</dc:date>
  <dc:language>PL</dc:language>
  <dc:format>PNG</dc:format>
  <dc:rights>CC-0</dc:rights>
  <dc:language>EN</dc:language>
</metadata>`;

export function createMockEdmMetadata() {
  const resourceId = 'urn://eriac/19';
  const metadata = new EdmMetadata();
  const objectFactory = new EdmObjectFactory(metadata);
  const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
  const aggregation = objectFactory.createObject(EdmObjectType.Aggregation);
  const webResource = objectFactory.createObject(EdmObjectType.WebResource);
  metadata.edmObjects = [providedCho, aggregation, webResource];
  providedCho.attrs = {
    about: resourceId,
  };
  const propertyFactory = EdmPropertyFactory.create();
  providedCho.edmProperties = [
    propertyFactory.createProperty(metadata, 'dc', 'contributor', {
      value: 'ERIAC',
      lang: 'en',
    }),
    propertyFactory.createProperty(metadata, 'dc', 'contributor', {
      value: 'ERIAC Archive',
      lang: 'en',
    }),
    propertyFactory.createProperty(metadata, 'dc', 'date', {
      value: '2018-03-13',
      lang: 'en',
    }),
    propertyFactory.createProperty(metadata, 'dc', 'description', {
      value: 'Artwork "Romani Kali Daj II" by Małgorzata Mirga-Tas at the exhibition "Hidden Roma Masterpieces"',
      lang: 'en',
    }),
    propertyFactory.createProperty(metadata, 'dc', 'identifier', {
      value: '19',
      lang: 'en',
    }),
    // ...
    propertyFactory.createProperty(metadata, 'dc', 'subject', {
      resource: 'http://vocab.getty.edu/aat/300389150',
    }),
    propertyFactory.createProperty(metadata, 'dc', 'subject', {
      resource: 'http://www.wikidata.org/entity/Q8060',
    }),
    // ...
    propertyFactory.createProperty(metadata, 'dc', 'subject', {
      value: 'arts',
    }),
    propertyFactory.createProperty(metadata, 'dc', 'subject', {
      value: 'culture',
    }),
    // ...
    propertyFactory.createProperty(metadata, 'dc', 'type', {
      value: 'Image',
      lang: 'en',
    }),
    // ...
    propertyFactory.createProperty(metadata, 'dcterms', 'created', {
      value: '2018-03-13',
    }),
    // ...
    propertyFactory.createProperty(metadata, 'edm', 'type', {
      value: 'IMAGE',
    }),
  ];
  aggregation.attrs = {
    about: resourceId,
  };
  aggregation.edmProperties = [
    propertyFactory.createProperty(metadata, 'edm', 'type', {
      value: 'IMAGE',
    }),
    propertyFactory.createProperty(metadata, 'edm', 'dataProvider', {
      value: 'ERIAC',
      lang: 'en',
    }),
    propertyFactory.createProperty(metadata, 'edm', 'isShownBy', {
      resource: 'https://eriac.org/wp-content/uploads/2018/03/IMG_1578-1200x800.jpg',
    }),
  ];
  webResource.attrs = {
    about: resourceId,
  };
  webResource.edmProperties = [
    propertyFactory.createProperty(metadata, 'edm', 'aggregatedCHO', {
      resource: resourceId,
    }),
    propertyFactory.createProperty(metadata, 'edm', 'dataProvider', {
      value: 'ERIAC',
      lang: 'en',
    }),
  ];
  return metadata;
}

export const exampleEdmXml = `<?xml version="1.0" encoding="UTF-8"?>
  <rdf:RDF xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:rdaGr2="http://rdvocab.info/ElementsGr2/" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crm="http://www.cidoc-crm.org/rdfs/cidoc_crm_v5.0.2_english_label.rdfs#" xmlns:xalan="http://xml.apache.org/xalan" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:svcs="http://rdfs.org/sioc/services#">
    <edm:ProvidedCHO rdf:about="urn://eriac/19">
      <dc:contributor xml:lang="en">ERIAC</dc:contributor>
      <dc:contributor xml:lang="en">ERIAC Archive</dc:contributor>
      <dc:date xml:lang="en">2018-03-13</dc:date>
      <dc:description xml:lang="en">Artwork "Romani Kali Daj II" by Małgorzata Mirga-Tas at the exhibition "Hidden Roma Masterpieces"</dc:description>
      <dc:identifier xml:lang="en">19</dc:identifier>
      <dc:publisher xml:lang="en">ERIAC</dc:publisher>
      <dc:rights xml:lang="en">In Copyright - Educational Use Permitted</dc:rights>
      <dc:subject rdf:resource="http://vocab.getty.edu/aat/300389150"/>
      <dc:subject rdf:resource="http://www.wikidata.org/entity/Q8060"/>
      <dc:subject rdf:resource="http://vocab.getty.edu/aat/300054137"/>
      <dc:subject rdf:resource="http://vocab.getty.edu/aat/300025929"/>
      <dc:subject> arts</dc:subject>
      <dc:subject>culture</dc:subject>
      <dc:subject>exhibition</dc:subject>
      <dc:subject>contemporary art</dc:subject>
      <dc:subject>intangible cultural heritage</dc:subject>
      <dc:title xml:lang="en">Exhibition | Hidden Roma Masterpieces #2</dc:title>
      <dc:type xml:lang="en">Image</dc:type>
      <dcterms:created>2018-03-13</dcterms:created>
      <dcterms:isPartOf>WEAVE</dcterms:isPartOf>
      <dcterms:medium xml:lang="en">Digital Image</dcterms:medium>
      <dcterms:spatial rdf:resource="https://sws.geonames.org/2950159/"/>
      <dcterms:spatial rdf:resource="https://sws.geonames.org/6255148/"/>
      <dcterms:spatial xml:lang="en">Berlin, Germany</dcterms:spatial>
      <edm:hasMet rdf:resource="http://www.wikidata.org/entity/Q25291"/>
      <edm:type>IMAGE</edm:type>
    </edm:ProvidedCHO>
    <edm:WebResource rdf:about="https://eriac.org/wp-content/uploads/2018/03/IMG_1578-1200x800.jpg">
      <dc:creator xml:lang="en"/>
      <dc:description xml:lang="en"/>
      <dc:format xml:lang="en">JPG</dc:format>
      <dcterms:created xml:lang="en">2018-03-13</dcterms:created>
      <dcterms:isPartOf xml:lang="en"/>
    </edm:WebResource>
    <ore:Aggregation rdf:about="urn://eriac/19">
      <edm:aggregatedCHO rdf:resource="urn://eriac/19"/>
      <edm:dataProvider xml:lang="en">ERIAC</edm:dataProvider>
      <edm:isShownAt rdf:resource="https://eriac.org/hidden-roma-masterpieces/"/>
      <edm:isShownBy rdf:resource="https://eriac.org/wp-content/uploads/2018/03/IMG_1578-1200x800.jpg"/>
      <edm:provider xml:lang="en">Photoconsortium</edm:provider>
      <edm:rights rdf:resource="http://rightsstatements.org/vocab/InC-EDU/1.0/"/>
    </ore:Aggregation>
  </rdf:RDF>`;

export const exampleEdmShortXml = `<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
  <edm:ProvidedCHO>
  </edm:ProvidedCHO>
</rdf:RDF>
`;

export const exampleEdmEuropeanaXml = `<?xml version="1.0"  encoding="UTF-8" ?>
  <rdf:RDF
    xmlns:crm="http://www.cidoc-crm.org/rdfs/cidoc_crm_v5.0.2_english_label.rdfs#"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:dcterms="http://purl.org/dc/terms/"
    xmlns:edm="http://www.europeana.eu/schemas/edm/"
    xmlns:foaf="http://xmlns.com/foaf/0.1/"
    xmlns:ore="http://www.openarchives.org/ore/terms/"
    xmlns:owl="http://www.w3.org/2002/07/owl#"
    xmlns:rdaGr2="http://rdvocab.info/ElementsGr2/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    xmlns:svcs="http://rdfs.org/sioc/services#"
    xmlns:wgs84="http://www.w3.org/2003/01/geo/wgs84_pos#"
    xmlns:xalan="http://xml.apache.org/xalan">
    <edm:ProvidedCHO rdf:about="http://mint-projects.image.ntua.gr/photography/ProvidedCHO/Ajuntament_de_Girona/044161">
      <dc:contributor xml:lang="ca">Basseda Casas, Joan</dc:contributor>
      <dc:creator xml:lang="ca">Desconegut</dc:creator>
      <dc:date>1848-1851</dc:date>
      <dc:description xml:lang="ca">Retrat d'estudi d'una dona jove amb una cinta i un joiell al coll.

  Separador cartouche, 1847-1856
  Coixinet de vellut vermell amb estampat floral simple, 1848-1853.
  Capsa de cuir &amp;quot;The Delicate Roses&amp;quot;, 1848-1851.</dc:description>
      <dc:format>Photography</dc:format>
      <dc:identifier>044161</dc:identifier>
      <dc:language>ca</dc:language>
      <dc:rights>Public Domain</dc:rights>
      <!-- test -->
      <dc:source xml:lang="ca">Colˇlecció Joan Basseda Casas</dc:source>
      <dc:subject rdf:resource="http://www.wikidata.org/entity/Q6581072"/>
      <dc:subject rdf:resource="http://vocab.getty.edu/aat/300223022"/>
      <dc:subject>Dones</dc:subject>
      <dc:subject>Retrats d'estudi</dc:subject>
      <dc:title xml:lang="ca">[Retrat d'estudi d'una dona]</dc:title>
      <dc:type xml:lang="ca">Fotografia</dc:type>
      <dc:type rdf:resource="http://vocab.getty.edu/aat/300046300"/>
      <dc:type>retrat</dc:type>
      <dc:type rdf:resource="http://vocab.getty.edu/aat/300015637"/>
      <dc:type>B/N</dc:type>
      <dc:type rdf:resource="http://vocab.getty.edu/aat/300128347"/>
      <dc:type rdf:resource="http://vocab.getty.edu/aat/300138191"/>
      <dc:type rdf:resource="http://vocab.getty.edu/aat/300127181"/>
      <dc:type rdf:resource="http://vocab.getty.edu/aat/300011020"/>
      <dcterms:extent>1/6 de placa</dcterms:extent>
      <dcterms:isPartOf>Weave</dcterms:isPartOf>
      <dcterms:medium rdf:resource="http://vocab.getty.edu/aat/300010900"/>
      <dcterms:spatial xml:lang="ca">Unknown</dcterms:spatial>
      <edm:type>3D</edm:type>
    </edm:ProvidedCHO>
    <!-- object test -->
    <ore:Aggregation rdf:about="http://mint-projects.image.ntua.gr/photography/ProvidedCHO/Ajuntament de Girona/044161">
      <edm:aggregatedCHO rdf:resource="http://mint-projects.image.ntua.gr/photography/ProvidedCHO/Ajuntament_de_Girona/044161"/>
      <edm:dataProvider>Ajuntament de Girona</edm:dataProvider>
      <edm:isShownAt rdf:resource="https://sgdap.girona.cat/fotoweb/archives/5002-Fotografia/FOTOGRAFIA/Col-leccio_Basseda/Positius_directe_camera/044161.jpg.info"/>
      <edm:isShownBy rdf:resource="https://weave-3dviewer.com/asset/5c545fe8-43e1-4020-8457-70c164e4b504"/>
      <edm:object rdf:resource="http://sgdap.girona.cat/sdam/imatges/044161.jpg"/>
      <edm:provider>Photoconsortium</edm:provider>
      <edm:rights rdf:resource="http://creativecommons.org/publicdomain/mark/1.0/"/>
    </ore:Aggregation>
  </rdf:RDF>`;

export const generateEdmSurplusXml = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:adms="http://www.w3.org/ns/adms#"
    xmlns:cc="http://creativecommons.org/ns#"
    xmlns:crm="http://www.cidoc-crm.org/rdfs/cidoc_crm_v5.0.2_english_label.rdfs#"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:dcat="http://www.w3.org/ns/dcat#"
    xmlns:dcterms="http://purl.org/dc/terms/"
    xmlns:doap="http://usefulinc.com/ns/doap#"
    xmlns:ebucore="http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#"
    xmlns:edm="http://www.europeana.eu/schemas/edm/"
    xmlns:foaf="http://xmlns.com/foaf/0.1/"
    xmlns:odrl="http://www.w3.org/ns/odrl/2/"
    xmlns:ore="http://www.openarchives.org/ore/terms/"
    xmlns:owl="http://www.w3.org/2002/07/owl#"
    xmlns:rdaGr2="http://rdvocab.info/ElementsGr2/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    xmlns:svcs="http://rdfs.org/sioc/services#"
    xmlns:wgs84="http://www.w3.org/2003/01/geo/wgs84_pos#"
    xmlns:xalan="http://xml.apache.org/xalan">
    <edm:ProvidedCHO rdf:about="#example_IIIF_Image_1">
        <dc:date>Before 1942</dc:date>
        <dc:language>chi</dc:language>
        <dc:title xml:lang="en">Image IIIF Example Record Tier 1</dc:title>
        <dc:type rdf:resource="http://vocab.getty.edu/aat/300028877"/>
        <dc:subject rdf:resource="http://vocab.getty.edu/aat/300018322"/>
        <!-- <dc:format xml:lang="en">object</dc:format> -->
        <dc:format>BLEND</dc:format>
        <dcterms:isPartOf>Europeana Foundation Example Records</dcterms:isPartOf>
        <edm:currentLocation rdf:resource="https://sws.geonames.org/2751773/"/>
        <edm:type>IMAGE</edm:type>
    </edm:ProvidedCHO>
    <ore:Aggregation rdf:about="#example_IIIF_Image_1_AGG">
            <edm:aggregatedCHO rdf:resource="#example_IIIF_Image_1"/>
            <edm:dataProvider>Europeana Foundation</edm:dataProvider>
            <edm:isShownAt rdf:resource="http://hdl.handle.net/1887.1/item:3175415"/>
            <edm:isShownBy rdf:resource="https://iiif.universiteitleiden.nl/iiif/2/hdl%3A1887.1%2Fitem%3A360462/full/333,/0/default.jpg"/>
            <edm:object rdf:resource="https://iiif.universiteitleiden.nl/iiif/2/hdl%3A1887.1%2Fitem%3A3175421/full/333,/0/default.jpg"/>
            <edm:provider>Europeana Foundation</edm:provider>
        <edm:rights rdf:resource="http://rightsstatements.org/vocab/InC/1.0/"/>
    </ore:Aggregation>
    <edm:WebResource rdf:about="https://iiif.universiteitleiden.nl/iiif/2/hdl%3A1887.1%2Fitem%3A360462/full/333,/0/default.jpg">
                <dc:format>jpg</dc:format>
                <dcterms:created>2017</dcterms:created>
                <dcterms:isReferencedBy rdf:resource="https://digitalcollections.universiteitleiden.nl/iiif_manifest/item:3175415/manifest"/>
                <svcs:has_service rdf:resource="https://iiif.universiteitleiden.nl/iiif/2/hdl%3A1887.1%2Fitem%3A3175421"/>
                <dc:rights>Use of this resource is governed by the terms and conditions of the Creative Commons CC BY License</dc:rights>
                <edm:rights rdf:resource="http://rightsstatements.org/vocab/InC/1.0/"/>
    </edm:WebResource>
    <svcs:Service rdf:about="https://iiif.universiteitleiden.nl/iiif/2/hdl%3A1887.1%2Fitem%3A3175421">
                <dcterms:conformsTo rdf:resource="http://iiif.io/api/image"/>
                <doap:implements rdf:resource="http://iiif.io/api/image/2/level2.json"/>
    </svcs:Service>
</rdf:RDF>`;
