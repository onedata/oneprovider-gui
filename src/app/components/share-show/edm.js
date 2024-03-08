/**
 * Edit or view XML of Europeana Data Model
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, and, raw, or, bool, conditional } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';

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

  //#endregion

  //#region state

  aceEditor: undefined,

  isValid: true,

  /**
   * @type {'visual'|'xml'}
   */
  mode: defaultMode,

  //#endregion

  isEmpty: not('xmlValue'),

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
    // FIXME: debug code
    this.set('xmlValue', generateDefaultXml(this.initialData));
    this.set('visualEdmViewModel', VisualEdmViewModel
      .extend({
        xmlValue: reads('container.xmlValue'),
      })
      .create({
        ownerSource: this,
        container: this,
      })
    );
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    if (!this.xmlValue) {
      this.onUpdateXml(generateDefaultXml(this.initialData));
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
    /**
     * @param {'visual'|'xml'} newMode
     */
    changeMode(newMode) {
      this.visualEdmViewModel.updateMetadataModel();
      this.set('mode', newMode);
    },
    aceEditorReady(aceEditor) {
      this.setupAceEditor(aceEditor);
    },
    sourceChanged(value) {
      if (!value) {
        this.set('isValid', true);
      }
      this.onUpdateXml(value);
    },
    // TODO: VFS-11645 Ask for unsaved changed when cancelling and chaning view
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
