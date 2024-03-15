import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
// FIXME: remove if unused
// import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
// import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
// import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';

export default Component.extend({
  exampleXml: undefined,

  init() {
    this._super(...arguments);
    this.set('exampleXml', generateShortXml());
    this.set('visualEdmViewModel', VisualEdmViewModel
      .extend({
        xmlValue: reads('container.exampleXml'),
      })
      .create({
        ownerSource: this,
        container: this,
        isReadOnly: false,
      })
    );

    // FIXME: test metadata
    // const metadata = this.visualEdmViewModel.edmMetadata;
    // const factory = EdmMetadataFactory.create();
    // const propertyFactory = EdmPropertyFactory.create();
    // const creator = propertyFactory.createProperty(metadata, 'dc', 'creator', {
    //   value: 'John Smith',
    // });
    // const title1 = propertyFactory.createProperty(metadata, 'dc', 'title', {
    //   value: 'My share',
    //   // lang: 'en',
    // });
    // // const title2 = propertyFactory.createProperty(metadata, 'dc', 'title', {
    // //   value: 'Posąg Jasia Fasoli',
    // //   lang: 'pl',
    // // });
    // // const subject = propertyFactory.createProperty(metadata, 'dc', 'subject', {
    // //   resource: 'http://vocab.getty.edu/aat/300019275',
    // //   // lang: 'en',
    // // });
    // // const description = propertyFactory.createProperty(metadata, 'dc', 'description', {
    // //   value: 'Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis.',
    // // });

    // const webResource1 = factory.createObject(metadata, EdmObjectType.WebResource);
    // const webResource2 = factory.createObject(metadata, EdmObjectType.WebResource);
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
