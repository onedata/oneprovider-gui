import Component from '@ember/component';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
// FIXME: remove if unused
// import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
// import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
// import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
// import EdmObjectFactory from '../utils/edm/object-factory';

export default Component.extend({
  exampleXml: undefined,

  init() {
    this._super(...arguments);
    this.set('exampleXml', generateShortXml());

    const metadataFactory = EdmMetadataFactory.create();
    const edmMetadata = metadataFactory.createInitialMetadata();

    this.set('visualEdmViewModel', VisualEdmViewModel
      .extend({
        // xmlValue: reads('container.exampleXml'),
      })
      .create({
        ownerSource: this,
        // container: this,
        edmMetadata,
        isReadOnly: false,
      })
    );

    // FIXME: test metadata
    // const metadata = this.visualEdmViewModel.edmMetadata;
    // const propertyFactory = EdmPropertyFactory.create();
    // const objectFactory = new EdmObjectFactory(metadata);
    // const creator = propertyFactory.createProperty('dc', 'creator', {
    //   value: 'John Smith',
    // });
    // const title1 = propertyFactory.createProperty('dc', 'title', {
    //   value: 'My share',
    //   // lang: 'en',
    // });
    // // const title2 = propertyFactory.createProperty('dc', 'title', {
    // //   value: 'Posąg Jasia Fasoli',
    // //   lang: 'pl',
    // // });
    // // const subject = propertyFactory.createProperty('dc', 'subject', {
    // //   resource: 'http://vocab.getty.edu/aat/300019275',
    // //   // lang: 'en',
    // // });
    // // const description = propertyFactory.createProperty('dc', 'description', {
    // //   value: 'Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis.',
    // // });

    // const webResource1 = objectFactory.createObject(EdmObjectType.WebResource);
    // const webResource2 = objectFactory.createObject(EdmObjectType.WebResource);
    // metadata.edmObjects = [...metadata.edmObjects, webResource1, webResource2];

    // metadata.edmObjects[0].edmProperties = [
    //   creator,
    //   title1,
    //   // subject,
    //   // description,
    //   // title2,
    // ];
  },

  actions: {
    generateXml() {
      console.log(this.visualEdmViewModel.edmMetadata.stringify());
    },
  },
});

const generateExampleXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
  <edm:ProvidedCHO rdf:about="share3d:1027">
    <dc:title xml:lang="en">Ivory plaque with nativity scenes</dc:title>
    <dc:description xml:lang="en">A 12th century ivory plaque carved with scenes in three registers.

Top:  the Annunciation (Mary and the Angel Gabriel) and the Visitation (Mary and Elizabeth). The Nativity with Mary lying on a bed and the Infant Christ just above her being warmed by the ox and ass. A figure stands on either side of this scene, possibly Salomé (the midwife) and Joseph.

Bottom: Jesus is being presented by Mary to a male figure carrying doves. In the bottom left-hand corner the Massacre of the Innocents is depicted. Mosan or German.

Accession no.: CG 005. Current location: The Hunt Museum, Limerick, Ireland.</dc:description>
    <dc:creator>The Hunt Museum as part of the Art of Reading in the Middle Ages project.</dc:creator>
    <dc:subject xml:lang="en">Cultural Heritage &amp; History</dc:subject>
    <dc:subject rdf:resource="http://vocab.getty.edu/aat/300011857"/>
  </edm:ProvidedCHO>
  <edm:WebResource rdf:about="https://sketchfab.com/models/5a5173b4756d46059e7ea9b70aabb4ca/embed">
    <dc:creator>The Hunt Museum as part of the Art of Reading in the Middle Ages project.</dc:creator>
    <dc:description xml:lang="en">Models are created using Shining3D’s Einscan Pro 2X laser scanner and ExScan Pro software. They are then processed using Meshlab and Blender. </dc:description>
    <dc:format xml:lang="en" rdf:resource="https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir80-1978.pdf" />
    <dc:type xml:lang="en">3D</dc:type>
    <dcterms:created>2021</dcterms:created>
    <edm:rights xml:lang="en" rdf:resource="https://creativecommons.org/licenses/by-nc/4.0/" />
  </edm:WebResource>
  <ore:Aggregation rdf:about="share3d:1027#aggregation">
    <edm:aggregatedCHO rdf:resource="share3d:1027"/>
    <edm:dataProvider>The Hunt Museum</edm:dataProvider>
    <edm:provider>CARARE</edm:provider>
    <edm:isShownAt rdf:resource="https://sketchfab.com/models/5a5173b4756d46059e7ea9b70aabb4ca/embed"/>
    <edm:isShownBy rdf:resource="https://sketchfab.com/models/5a5173b4756d46059e7ea9b70aabb4ca"/>
    <edm:rights rdf:resource="https://creativecommons.org/licenses/by-nc/4.0/"/>
    <edm:object rdf:resource="https://media.sketchfab.com/models/5a5173b4756d46059e7ea9b70aabb4ca/thumbnails/dd8c7d3afea340cd91f6a059bcd0093e/ac0602e1fab04039a134d92b1082bd0d.jpeg"/>
  </ore:Aggregation>
</rdf:RDF>
`;

const generateShortXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
  <edm:ProvidedCHO>
  </edm:ProvidedCHO>
</rdf:RDF>
`;

const generateLongXml = () =>
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
      <dc:rights>Public Domain</dc:rights>
      <dc:source xml:lang="ca">Colˇlecció Joan Basseda Casas</dc:source>
      <dc:subject rdf:resource="http://www.wikidata.org/entity/Q6581072"/>
      <dc:subject rdf:resource="http://vocab.getty.edu/aat/300223022"/>
      <dc:subject>Dones</dc:subject>
      <dc:subject>Retrats d'estudi</dc:subject>
      <dc:subject/>
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
