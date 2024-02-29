import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import VisualEdmViewModel from '../utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';

export default Component.extend({
  exampleXml: undefined,

  init() {
    this._super(...arguments);
    this.set('exampleXml', generateExampleXml());
    this.set('edmMetadata', EdmMetadataFactory.create().createMockEdmMetadata());
    this.set('visualEdmViewModel', VisualEdmViewModel
      .extend({
        xmlValue: reads('container.xmlValue'),
        edmMetadata: reads('container.edmMetadata'),
      })
      .create({
        ownerSource: this,
        container: this,
      })
    );
  },
});

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
    <dce:subject>exhibition</dce:subject>
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
