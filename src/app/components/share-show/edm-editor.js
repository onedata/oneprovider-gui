/**
 * Edit or view XML of European Data Model
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, and, raw, or, bool } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  classNames: ['edm-editor', 'open-data-metadata-editor', 'form-group'],
  classNameBindings: ['isValid::has-error'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.edmEditor',

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

  //#region

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

  /**
   * Classname added to columns to center the form content, as it is too wide
   * @type {String}
   */
  colClassname: 'col-xs-12 col-md-8 col-centered',

  //#endregion

  //#region state

  aceEditor: undefined,

  isValid: true,

  //#endregion

  isEmpty: not('xmlValue'),

  isSubmitDisabled: bool('submitDisabledReason'),

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
    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_edm_editor');
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    if (!this.xmlValue) {
      this.onUpdateXml(generateDefaultXML(this.initialData));
    }
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
    return this.onSubmit(this.xmlValue);
  },

  actions: {
    aceEditorReady(aceEditor) {
      this.setupAceEditor(aceEditor);
    },
    sourceChanged(value) {
      if (!value) {
        this.set('isValid', true);
      }
      this.onUpdateXml(value);
    },
    back() {
      this.onBack();
    },
    submit() {
      return this.submit();
    },
  },
});

/**
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.creator
 * @param {string} data.date
 * @param {string} data.shareUrl
 * @param {string} [data.organization]
 * @returns
 */
function generateDefaultXML(data) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:adms="http://www.w3.org/ns/adms#"
    xmlns:cc="http://creativecommons.org/ns#"
    xmlns:crm="http://www.cidoc-crm.org/rdfs/cidoc_crm/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
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
        <edm:dataProvider>${data.organization || data.creator}</edm:dataProvider>
        <edm:isShownAt rdf:resource="${data.shareUrl}"/>
        <edm:provider>${data.organization || data.creator}</edm:provider>
        <edm:rights rdf:resource="http://rightsstatements.org/vocab/NoC-OKLR/1.0/"/>
    </ore:Aggregation>
</rdf:RDF>`;
}
