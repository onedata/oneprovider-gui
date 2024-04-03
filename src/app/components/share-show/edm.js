/**
 * Edit or view XML of Europeana Data Model
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, and, raw, or, bool, conditional, eq, notEqual, array } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory, { InvalidEdmMetadataXmlDocument } from 'oneprovider-gui/utils/edm/metadata-factory';
import Edmvalidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { set, setProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { debounce } from '@ember/runloop';
import { dasherize } from '@ember/string';

const defaultMode = 'visual';

const EdmModelXmlSyncState = Object.freeze({
  Synced: 'synced',
  Waiting: 'waiting',
  NotParseable: 'notParseable',
  Parseable: 'parseable',
});

export default Component.extend(I18n, {
  classNames: ['share-show-edm', 'open-data-metadata-editor', 'form-group'],
  classNameBindings: [
    'isValid::invalid-metadata',
    'readonly:readonly',
    'syncStateClass',
  ],

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

  modelXmlSyncState: EdmModelXmlSyncState.Synced,

  //#endregion

  //#region configuration

  /**
   * @virtual optional
   * @type {boolean}
   */
  readonly: false,

  //#endregion

  //#region state

  aceEditor: undefined,

  isValid: reads('validator.isValid'),

  isXmlValueInvalid: false,

  /**
   * @type {'visual'|'xml'}
   */
  mode: defaultMode,

  //#endregion

  /**
   * @type {Edmvalidator}
   */
  validator: computed(
    'modelXmlSyncState',
    'visualEdmViewModel.validator',
    'tmpSourceValidator',
    function validator() {
      switch (this.modelXmlSyncState) {
        case EdmModelXmlSyncState.Synced:
          return this.visualEdmViewModel.validator;
        case EdmModelXmlSyncState.Parseable:
          return this.tmpSourceValidator;
        default:
          return null;
      }
    }
  ),

  isEmpty: not('currentXmlValue'),

  isSubmitDisabled: bool('submitDisabledReason'),

  isXmlNotParseable: eq('modelXmlSyncState', raw(EdmModelXmlSyncState.NotParseable)),

  isApplyXmlButtonShown: array.includes(
    raw([
      EdmModelXmlSyncState.Parseable,
      EdmModelXmlSyncState.NotParseable,
      EdmModelXmlSyncState.Waiting,
    ]),
    'modelXmlSyncState'
  ),

  isApplyXmlButtonDisabled: or(
    'isXmlNotParseable',
    eq('modelXmlSyncState', raw(EdmModelXmlSyncState.Waiting)),
  ),

  applyXmlButtonTip: or(
    and('isXmlNotParseable', computedT('submitDisabledReason.xmlNotValid')),
    and(
      eq('modelXmlSyncState', raw(EdmModelXmlSyncState.Waiting)),
      computedT('submitDisabledReason.validatingSync')
    ),
  ),

  /**
   * Classname added to columns to center the form content, as it is too wide
   * @type {String}
   */
  colClassname: conditional(
    'readonly',
    raw('col-xs-12 col-md-8 col-lg-7'),
    raw('col-xs-12 col-md-8 col-centered'),
  ),

  syncStateClass: computed('modelXmlSyncState', function syncStateClass() {
    return `xml-sync-${dasherize(this.modelXmlSyncState)}`;
  }),

  submitDisabledReason: or(
    and(
      eq('modelXmlSyncState', raw(EdmModelXmlSyncState.Waiting)),
      computedT('submitDisabledReason.validatingSync')
    ),
    and(
      'isXmlNotParseable',
      computedT('submitDisabledReason.xmlNotValid')
    ),
    and(
      notEqual('modelXmlSyncState', raw(EdmModelXmlSyncState.Synced)),
      computedT('submitDisabledReason.xmlNotAccepted')
    ),
    and(
      not('isValid'),
      computedT('submitDisabledReason.invalid')
    ),
    raw(null),
  ),

  isVisualModeDisabled: notEqual('modelXmlSyncState', raw(EdmModelXmlSyncState.Synced)),

  init() {
    this._super(...arguments);
    const metadataFactory = EdmMetadataFactory;
    let edmMetadata;
    if (this.xmlValue) {
      try {
        edmMetadata = metadataFactory.fromXml(this.xmlValue);
      } catch (error) {
        if (!(error instanceof InvalidEdmMetadataXmlDocument)) {
          throw error;
        }
        this.set('isXmlValueInvalid', true);
      }
    } else {
      edmMetadata = this.readonly ?
        metadataFactory.createEmptyMetadata() : metadataFactory.createInitialMetadata();
    }
    if (!this.isXmlValueInvalid) {
      const validator = Edmvalidator.create({ edmMetadata });
      this.set('visualEdmViewModel', VisualEdmViewModel.create({
        edmMetadata,
        validator: validator,
        isReadOnly: this.readonly,
      }));
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
    if (this.checkAceErrors()) {
      this.set('modelXmlSyncState', EdmModelXmlSyncState.NotParseable);
    }
  },

  checkAceErrors() {
    const annotations = this.aceEditor.getSession().getAnnotations();
    return annotations?.some(annotation => annotation.type === 'error');
  },

  submit() {
    this.replaceCurrentXmlValueUsingModel();
    return this.onSubmit(this.currentXmlValue);
  },

  replaceCurrentXmlValueUsingModel() {
    this.changeSource(this.visualEdmViewModel.edmMetadata.stringify(), false);
  },

  replaceModelUsingCurrentXml() {
    let edmMetadata;
    let validator;
    // TODO: VFS-11911 try to optimize: update model, do not create new model instance
    try {
      edmMetadata = EdmMetadataFactory.fromXml(this.currentXmlValue);
      validator = Edmvalidator.create({ edmMetadata });
      this.set('isXmlValueInvalid', false);
    } catch (error) {
      if (!(error instanceof InvalidEdmMetadataXmlDocument)) {
        throw error;
      }
      this.set('isXmlValueInvalid', true);
    }
    if (!this.isXmlValueInvalid) {
      setProperties(this.visualEdmViewModel, {
        edmMetadata,
        validator,
      });
    }
  },

  changeSource(value, invalidate = true) {
    const prevXmlValue = this.currentXmlValue;
    if (prevXmlValue === value) {
      return;
    }
    this.set('currentXmlValue', value);
    if (invalidate && prevXmlValue) {
      this.invalidateSourceModelSync();
    }
    // onUpdateXml could be not available in readonly mode
    this.onUpdateXml?.(value);
  },

  invalidateSourceModelSync() {
    this.set('modelXmlSyncState', EdmModelXmlSyncState.Waiting);
    debounce(this, 'validateSourceModelSync', 500);
  },

  validateSourceModelSync() {
    let edmMetadata;
    let validator;
    // TODO: VFS-11911 try to optimize: update model, do not create new model instance
    try {
      if (this.checkAceErrors()) {
        this.set('modelXmlSyncState', EdmModelXmlSyncState.NotParseable);
        return;
      }
      edmMetadata = EdmMetadataFactory.fromXml(this.currentXmlValue);
      validator = Edmvalidator.create({ edmMetadata });
      this.set('tmpSourceValidator', validator);
      this.set('modelXmlSyncState', EdmModelXmlSyncState.Parseable);
    } catch (error) {
      if (!(error instanceof InvalidEdmMetadataXmlDocument)) {
        throw error;
      }
      this.set('modelXmlSyncState', EdmModelXmlSyncState.NotParseable);
    }
  },

  acceptXml() {
    this.replaceModelUsingCurrentXml();
    this.replaceCurrentXmlValueUsingModel();
    this.set('modelXmlSyncState', EdmModelXmlSyncState.Synced);
  },

  /**
   * @param {'visual'|'xml'} newMode
   */
  changeMode(newMode) {
    if (newMode === 'visual') {
      if (this.modelXmlSyncState !== EdmModelXmlSyncState.Synced) {
        return;
      }
      if (this.isEmpty) {
        const newModel = EdmMetadataFactory.createInitialMetadata();
        set(this.visualEdmViewModel, 'edmMetadata', newModel);
      } else {
        this.replaceModelUsingCurrentXml();
      }
    } else {
      if (!this.isXmlValueInvalid) {
        this.replaceCurrentXmlValueUsingModel();
      }
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
    acceptXml() {
      this.acceptXml();
    },
  },
});
