import Component from '@ember/component';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from '../utils/edm/metadata-validator';
// FIXME: remove if unused
// import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
// import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
// import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
// import EdmObjectFactory from '../utils/edm/object-factory';

export default Component.extend({
  init() {
    this._super(...arguments);
    const factory = EdmMetadataFactory.create();
    // const edmMetadata = factory.createInitialMetadata();
    const edmMetadata = factory.fromXml(generateEuropeanaXml());
    this.set('visualEdmViewModel', VisualEdmViewModel.create({
      ownerSource: this,
      edmMetadata,
      validator: EdmMetadataValidator.create({ edmMetadata }),
      isReadOnly: false,
    }));
  },

  actions: {
    generateXml() {
      console.log(this.visualEdmViewModel.edmMetadata.stringify());
    },
  },
});

// function createTestMetadata() {
//   // FIXME: test metadata
//   const metadata = this.visualEdmViewModel.edmMetadata;
//   const propertyFactory = EdmPropertyFactory.create();
//   const objectFactory = new EdmObjectFactory(metadata);
//   const creator = propertyFactory.createProperty('dc', 'creator', {
//     value: 'John Smith',
//   });
//   const title1 = propertyFactory.createProperty('dc', 'title', {
//     value: 'My share',
//     // lang: 'en',
//   });
//   // const title2 = propertyFactory.createProperty('dc', 'title', {
//   //   value: 'Posąg Jasia Fasoli',
//   //   lang: 'pl',
//   // });
//   // const subject = propertyFactory.createProperty('dc', 'subject', {
//   //   resource: 'http://vocab.getty.edu/aat/300019275',
//   //   // lang: 'en',
//   // });
//   // const description = propertyFactory.createProperty('dc', 'description', {
//   //   value: 'Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis.',
//   // });

//   const webResource1 = objectFactory.createObject(EdmObjectType.WebResource);
//   const webResource2 = objectFactory.createObject(EdmObjectType.WebResource);
//   metadata.edmObjects = [...metadata.edmObjects, webResource1, webResource2];

//   metadata.edmObjects[0].edmProperties = [
//     creator,
//     title1,
//     // subject,
//     // description,
//     // title2,
//   ];
// }

const generateExampleXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?>
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

const generateShortXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
  <edm:ProvidedCHO>
  </edm:ProvidedCHO>
</rdf:RDF>
`;

const generateEuropeanaXml = () =>
  `<?xml version="1.0"  encoding="UTF-8" ?>
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

const generateSurplusXml = () => `<?xml version="1.0" encoding="UTF-8"?>
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
