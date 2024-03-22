/**
 * Edit or view XML of Europeana Data Model
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import emberAwesomeMacros, { not, and, raw, or, bool, conditional } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { set } from '@ember/object';

const defaultMode = 'visual';

export default Component.extend(I18n, {
  classNames: ['share-show-edm', 'open-data-metadata-editor', 'form-group'],
  classNameBindings: ['isValid::has-error', 'readonly:readonly'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.edm',

  //#region virtual

  /**
   * @virtual
   * @type {string}
   */
  xmlValue: undefined,

  /**
   * @virtual
   * @type {Models.HandleService}
   */
  handleService: undefined,

  /**
   * @virtual
   * @type {(xml: string) => void}
   */
  onUpdateXml: undefined,

  /**
   * @virtual
   * @type {() => Promise}
   */
  onSubmit: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onBack: undefined,

  //#endregion

  //#region state

  /**
   * @type {string}
   */
  currentXmlValue: '',

  //#endregion

  //#region configuration

  /**
   * Initial values of: 'title', 'creator' and 'date' fields.
   * @virtual optional
   * @type {Object}
   */
  initialData: Object.freeze({}),

  /**
   * @virtual optional
   * @type {boolean}
   */
  readonly: false,

  //#endregion

  //#region state

  aceEditor: undefined,

  isValid: true,

  /**
   * @type {'visual'|'xml'}
   */
  mode: defaultMode,

  /**
   * @type {EdmMetadataValidator}
   */
  metadataValidator: undefined,

  //#endregion

  isEmpty: not('currentXmlValue'),

  isSubmitDisabled: bool('submitDisabledReason'),

  /**
   * Classname added to columns to center the form content, as it is too wide
   * @type {String}
   */
  colClassname: conditional(
    'readonly',
    raw('col-xs-12 col-md-8 col-lg-7'),
    raw('col-xs-12 col-md-8 col-centered'),
  ),

  submitDisabledReason: or(
    and(
      'isEmpty',
      computedT('submitDisabledReason.empty')
    ),
    and(
      not('isValid'),
      computedT('submitDisabledReason.invalid')
    ),
    raw(null),
  ),

  init() {
    this._super(...arguments);
    // FIXME: dodać komentarze początkowe do XML-a
    const metadataFactory = EdmMetadataFactory.create();
    let edmMetadata;
    if (this.xmlValue) {
      edmMetadata = metadataFactory.fromXml(this.xmlValue);
    } else {
      if (this.readonly) {
        edmMetadata = metadataFactory.createEmptyMetadata();
      } else {
        edmMetadata = metadataFactory.fromXml(this.getMockXml());
        // edmMetadata = metadataFactory.createInitialMetadata();
      }
    }
    const metadataValidator = EdmMetadataValidator.create({ edmMetadata });
    this.set('metadataValidator', metadataValidator);
    this.set('visualEdmViewModel', VisualEdmViewModel.create({
      edmMetadata,
      validator: metadataValidator,
      isReadOnly: this.readonly,
    }));

    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_edm');
  },

  setupAceEditor(aceEditor) {
    this.set('aceEditor', aceEditor);
    this.annotationChanged();
    aceEditor.getSession().on('changeAnnotation', () => {
      this.annotationChanged();
    });
  },

  annotationChanged() {
    const annotations = this.aceEditor.getSession().getAnnotations();
    const errorsPresent = annotations?.some(annotation => annotation.type === 'error');
    this.set('isValid', !errorsPresent);
  },

  submit() {
    return this.onSubmit(this.currentXmlValue);
  },

  updateCurrentXmlValue() {
    this.visualEdmViewModel.edmMetadata.sort();
    this.changeSource(this.visualEdmViewModel.edmMetadata.stringify());
  },

  updateModelFromCurrentXml() {
    set(
      this.visualEdmViewModel,
      'edmMetadata',
      EdmMetadataFactory.create().fromXml(this.currentXmlValue)
    );
  },

  changeSource(value) {
    if (!value) {
      this.set('isValid', true);
    }
    this.set('currentXmlValue', value);
    // onUpdateXml could be not available in readonly mode
    this.onUpdateXml?.(value);
  },

  /**
   * @param {'visual'|'xml'} newMode
   */
  changeMode(newMode) {
    if (newMode === 'visual') {
      this.updateModelFromCurrentXml();
    } else {
      this.updateCurrentXmlValue();
    }
    this.set('mode', newMode);
  },

  actions: {
    /**
     * @param {'visual'|'xml'} newMode
     * @returns {void}
     */
    changeMode(newMode) {
      this.changeMode(newMode);
    },
    aceEditorReady(aceEditor) {
      this.setupAceEditor(aceEditor);
    },
    sourceChanged(value) {
      this.changeSource(value);
    },
    // TODO: VFS-11645 Ask for unsaved changed when cancelling and chaning view
    back() {
      this.onBack();
    },
    submit() {
      return this.submit();
    },
  },

  getMockXml() {
    return `<?xml version="1.0"  encoding="UTF-8" ?>
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
  },
});

// FIXME: przenieść do generatora albo usunąć
/**
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.creator
 * @param {string} data.date
 * @param {string} data.shareUrl
 * @param {string} [data.organizationName]
 * @returns
 */
function generateDefaultXml(data) {
  return `<?xml version="1.0" encoding="UTF-8"?>

<!-- Example EDM XML content - replace it with the detailed metadata. -->
<!-- Refer to the documentation of EDM at the following links: -->
<!-- https://pro.europeana.eu/page/edm-documentation -->
<!-- https://europeana.atlassian.net/wiki/spaces/EF/pages/2165440526/Namespaces -->
<!-- https://europeana.atlassian.net/wiki/spaces/EF/pages/987791389/EDM+-+Mapping+guidelines -->
<!-- https://europeana.atlassian.net/wiki/spaces/EF/pages/1969258498/Metadata+Tier+A -->
<!-- https://pro.europeana.eu/files/Europeana_Professional/Share_your_data/Technical_requirements/EDM_Documentation/EDM_Definition_v5.2.8_102017.pdf -->

<rdf:RDF
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:edm="http://www.europeana.eu/schemas/edm/"
    xmlns:ore="http://www.openarchives.org/ore/terms/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
>
    <edm:ProvidedCHO rdf:about="#exampleMet0">
        <dc:title>${data.title}</dc:title>
        <dc:language>en</dc:language>
        <dc:type>dataset</dc:type>
        <edm:type>TEXT</edm:type>
        <dc:creator>${data.creator}</dc:creator>
        <dc:date>${data.date}</dc:date>
    </edm:ProvidedCHO>
    <ore:Aggregation rdf:about="#exampleMet0_AGG">
        <edm:aggregatedCHO rdf:resource="#exampleMet0"/>
        <edm:dataProvider>Example Organization</edm:dataProvider>
        <edm:isShownAt rdf:resource="${data.shareUrl}"/>
        <edm:provider>Example Organization</edm:provider>
        <edm:rights rdf:resource="http://rightsstatements.org/vocab/NoC-OKLR/1.0/"/>
    </ore:Aggregation>
</rdf:RDF>`;
}
