/**
 * Edit or view XML of Europeana Data Model
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { and, raw, or, conditional, eq, notEqual, array } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm/view-model';
import EdmMetadataFactory, { InvalidEdmMetadataXmlDocument } from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { set, setProperties, computed, observer } from '@ember/object';
import { not, reads, or as emberOr } from '@ember/object/computed';
import { cancel, debounce } from '@ember/runloop';
import { dasherize } from '@ember/string';
import { inject as service } from '@ember/service';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';
import EdmObjectType from '../../utils/edm/object-type';
import EdmPropertyFactory from '../../utils/edm/property-factory';

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
    'isReadOnly:readonly',
    'syncStateClass',
    'modeClass',
  ],

  media: service(),

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
   * @type {boolean}
   */
  isPublicView: false,

  /**
   * @virtual
   * @type {Models.File}
   */
  shareRootFile: undefined,

  /**
   * @virtual
   * @type {(xml: string) => void}
   */
  onUpdateXml: undefined,

  /**
   * @virtual
   * @type {(metadataXml: string) => Promise}
   */
  onSubmit: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onBack: undefined,

  /**
   * @virtual optional
   * @type {(metadataXml: string) => Promise}
   */
  onModify: undefined,

  /**
   * @virtual optional
   * @type {(isEditMode: boolean) => void}
   */
  onChangeEditMode: undefined,

  /**
   * @virtual optional
   * @type {Models.HandleService}
   */
  handleService: undefined,

  /**
   * Set to true if metadata is already published.
   * @virtual optional
   * @type {boolean}
   */
  isPublished: false,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isDisabled: false,

  //#endregion

  //#region state

  /**
   * Last XML value that is synchronized between visual and XML editor.
   * @type {string}
   */
  acceptedXmlValue: undefined,

  /**
   * @type {string}
   */
  currentXmlValue: undefined,

  modelXmlSyncState: EdmModelXmlSyncState.Synced,

  representativeImageError: undefined,

  /**
   * Return value from `debounce` scheduling `validateSourceModelSync`.
   * @type {any}
   */
  pendingValidationTimer: undefined,

  /**
   * @type {boolean}
   */
  isSaving: false,

  //#endregion

  //#region configuration

  /**
   * @virtual optional
   * @type {boolean}
   */
  isReadOnly: false,

  /**
   * Number of spaces in XML indent.
   * @type {number}
   */
  tabSize: 4,

  //#endregion

  //#region state

  aceEditor: undefined,

  isXmlValueInvalid: false,

  /**
   * Stores previous metadata validator object to detroy it on recomputation.
   * @type {EdmMetadataValidator}
   */
  prevValidator: undefined,

  /**
   * @type {'visual'|'xml'}
   */
  mode: defaultMode,

  /**
   * @type {EdmMetadataValidator}
   */
  notAcceptedSourceValidator: undefined,

  //#endregion

  isValid: reads('validator.isValid'),

  isModifyButtonShown: computed(
    'isPublicView',
    'editMode',
    function isModifyButtonShown() {
      return !this.isPublicView && (this.editMode === 'show' || this.editMode === 'edit');
    }
  ),

  /**
   * @type {EdmMetadataValidator|null}
   */
  validator: computed(
    'modelXmlSyncState',
    'visualEdmViewModel.validator',
    'notAcceptedSourceValidator',
    function validator() {
      switch (this.modelXmlSyncState) {
        case EdmModelXmlSyncState.Synced:
          return this.visualEdmViewModel?.validator;
        case EdmModelXmlSyncState.Parseable:
          return this.notAcceptedSourceValidator;
        default:
          return null;
      }
    }
  ),

  isModifyingExistingMetadata: computed(
    'isPublished',
    'isReadOnly',
    function isModifyingExistingMetadata() {
      return this.isPublished && !this.isReadOnly;
    }
  ),

  isEmpty: not('currentXmlValue'),

  isSubmitDisabled: emberOr('isEffDisabled', 'submitDisabledReason'),

  isCancelDisabled: emberOr('isEffDisabled', 'cancelDisabledReason'),

  isXmlNotParseable: eq('modelXmlSyncState', raw(EdmModelXmlSyncState.NotParseable)),

  areApplyXmlButtonsShown: array.includes(
    raw([
      EdmModelXmlSyncState.Parseable,
      EdmModelXmlSyncState.NotParseable,
      EdmModelXmlSyncState.Waiting,
    ]),
    'modelXmlSyncState'
  ),

  isApplyXmlButtonDisabled: or(
    'isEffDisabled',
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

  discardXmlButtonTip: computed('modelXmlSyncState', function discardXmlButtonTip() {
    if (this.modelXmlSyncState === EdmModelXmlSyncState.Waiting) {
      return this.t('submitDisabledReason.validatingSync');
    }
  }),

  isDiscardXmlButtonDisabled: computed(
    'modelXmlSyncState',
    'isEffDisabled',
    function isDiscardXmlButtonDisabled() {
      return this.isEffDisabled ||
        this.modelXmlSyncState === EdmModelXmlSyncState.Waiting;
    }
  ),

  /**
   * Classname added to columns to center the form content, as it is too wide
   * @type {String}
   */
  colClassname: conditional(
    'isReadOnly',
    raw('col-xs-12 col-md-8 col-lg-7'),
    raw('col-xs-12 col-md-8 col-centered'),
  ),

  syncStateClass: computed('modelXmlSyncState', function syncStateClass() {
    return `xml-sync-${dasherize(this.modelXmlSyncState)}`;
  }),

  modeClass: computed('mode', function modeClass() {
    return `edm-mode-${this.mode}`;
  }),

  submitDisabledReason: computed(
    'modelXmlSyncState',
    'isXmlNotParseable',
    'isValid',
    'editMode',
    'visualEdmViewModel.isModified',
    function submitDisabledReason() {
      if (this.modelXmlSyncState === EdmModelXmlSyncState.Waiting) {
        return this.t('submitDisabledReason.validatingSync');
      }
      if (this.isXmlNotParseable) {
        return this.t('submitDisabledReason.xmlNotValid');
      }
      if (this.modelXmlSyncState !== EdmModelXmlSyncState.Synced) {
        return this.t('submitDisabledReason.xmlNotAccepted');
      }
      if (!this.isValid) {
        return this.t('submitDisabledReason.invalid');
      }
      if (this.editMode === 'edit' && !this.visualEdmViewModel.isModified) {
        return this.t('submitDisabledReason.noChanges');
      }
      return null;
    }
  ),

  cancelDisabledReason: computed('modelXmlSyncState', function cancelDisabledReason() {
    if (this.modelXmlSyncState !== EdmModelXmlSyncState.Synced) {
      return this.t('submitDisabledReason.xmlNotAccepted');
    }
  }),

  isVisualModeDisabled: notEqual('modelXmlSyncState', raw(EdmModelXmlSyncState.Synced)),

  imageUrl: reads('visualEdmViewModel.representativeImageReference'),

  isRepresentativeImageInParent: computed(
    'isReadOnly',
    'media.{isMobile,isTablet}',
    function isRepresentativeImageShown() {
      return this.isReadOnly && !this.media.isMobile && !this.media.isTablet;
    }
  ),

  /**
   * @type {MetadataEditorEditMode}
   */
  editMode: computed('isReadOnly', 'isPublished', function editMode() {
    if (this.isReadOnly) {
      return 'show';
    }
    return this.isPublished ? 'edit' : 'create';
  }),

  isEffDisabled: emberOr('isDisabled', 'isSaving'),

  xmlObserver: observer('xmlValue', function xmlObserver() {
    this.initMetadataModel();
    this.replaceCurrentXmlValueUsingModel();
  }),

  init() {
    this._super(...arguments);
    this.initMetadataModel();
    this.set('notAcceptedSourceValidator', EdmMetadataValidator.create());
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.visualEdmViewModel.validator?.destroy();
    this.visualEdmViewModel?.destroy();
    this.notAcceptedSourceValidator?.destroy();
  },

  initMetadataModel() {
    const metadataFactory = new EdmMetadataFactory();
    metadataFactory.shareRootFile = this.shareRootFile;
    let edmMetadata;
    if (this.xmlValue) {
      try {
        edmMetadata = EdmMetadataFactory.fromXml(this.xmlValue);
      } catch (error) {
        if (!(error instanceof InvalidEdmMetadataXmlDocument)) {
          throw error;
        }
        this.setIsXmlValueInvalid(true);
      }
    } else {
      edmMetadata = this.isReadOnly ?
        metadataFactory.createEmptyMetadata() : metadataFactory.createInitialMetadata();
    }
    if (!this.isXmlValueInvalid) {
      const validator = EdmMetadataValidator.create({ edmMetadata });
      this.initVisualEdmViewModel({
        validator,
        edmMetadata,
      });
    }
  },

  initVisualEdmViewModel({ edmMetadata, validator }) {
    const visualEdmViewModel = VisualEdmViewModel.extend({
        isRepresentativeImageShown: not('container.isRepresentativeImageInParent'),
        isReadOnly: reads('container.isReadOnly'),
        isDisabled: reads('container.isDisabled'),
      })
      .create({
        container: this,
        shareRootFile: this.shareRootFile,
        edmMetadata,
        validator,
      });
    this.set('visualEdmViewModel', visualEdmViewModel);
  },

  setupAceEditor(aceEditor) {
    // TODO: VFS-11950 Make this hack global (ACE editor wrapper)
    const aceSession = aceEditor.getSession();
    // optional chaining, because tests has specific ACE editor replacement
    aceSession.getUndoManager?.().reset();
    this.set('aceEditor', aceEditor);
    this.annotationChanged();
    aceSession.on('changeAnnotation', () => {
      this.annotationChanged();
    });
  },

  annotationChanged() {
    if (this.checkAceErrors()) {
      this.setModelXmlSyncState(EdmModelXmlSyncState.NotParseable);
    }
  },

  checkAceErrors() {
    // optional chaining, because tests has specific ACE editor replacement
    const annotations = this.aceEditor.getSession().getAnnotations?.();
    return annotations?.some(annotation => annotation.type === 'error');
  },

  async submit() {
    this.replaceCurrentXmlValueUsingModel();
    await this.onSubmit(this.currentXmlValue);
  },

  async submitMetadataUpdate() {
    this.replaceCurrentXmlValueUsingModel();
    const prevInjectedXmlValue = this.xmlValue;
    await this.onModify(this.currentXmlValue);
    this.onChangeEditMode?.(false);
    // Trigger observer, because sometimes the newly injected xmlValue is the same as
    // former xmlValue. It occurs when user only deletes the auto-generated fields and
    // they are automatically added by backend.
    if (prevInjectedXmlValue === this.xmlValue) {
      this.notifyPropertyChange('xmlValue');
    }
  },

  replaceCurrentXmlValueUsingModel() {
    const xmlValue = this.visualEdmViewModel.edmMetadata.stringify({
      tabSize: this.tabSize,
    });
    this.changeSource(xmlValue, false);
    this.set('acceptedXmlValue', xmlValue);
  },

  replaceModelUsingCurrentXml() {
    let edmMetadata;
    let validator;
    // TODO: VFS-11911 try to optimize: update model, do not create new model instance
    try {
      edmMetadata = EdmMetadataFactory.fromXml(this.currentXmlValue);
      validator = EdmMetadataValidator.create({ edmMetadata });
      this.setIsXmlValueInvalid(false);
    } catch (error) {
      if (!(error instanceof InvalidEdmMetadataXmlDocument)) {
        throw error;
      }
      this.setIsXmlValueInvalid(true);
    }
    if (!this.isXmlValueInvalid) {
      if (this.visualEdmViewModel) {
        this.visualEdmViewModel.validator?.destroy();
        setProperties(this.visualEdmViewModel, {
          edmMetadata,
          validator,
        });
      } else {
        // There could be almost impossible case, when visualEdmViewModel is not
        // initialized because input has been not parseable from start - so check if
        // visualEdmViewModel is not nullish.
        this.initVisualEdmViewModel({
          edmMetadata,
          validator,
        });
      }
      this.setModelXmlSyncState(EdmModelXmlSyncState.Synced);
      if (this.isModifyingExistingMetadata) {
        this.visualEdmViewModel.markAsModified();
      }
    }
  },

  changeSource(value, invalidate = true) {
    const prevXmlValue = this.currentXmlValue;
    if (prevXmlValue === value) {
      return;
    }
    this.set('currentXmlValue', value);
    if (this.currentXmlValue && this.currentXmlValue === this.acceptedXmlValue) {
      this.setModelXmlSyncState(EdmModelXmlSyncState.Synced);
      cancel(this.pendingValidationTimer);
    } else if (invalidate && prevXmlValue != null) {
      this.invalidateSourceModelSync();
    }
    // onUpdateXml could be not available in isReadOnly mode
    this.onUpdateXml?.(value);
  },

  invalidateSourceModelSync() {
    this.setModelXmlSyncState(EdmModelXmlSyncState.Waiting);
    const pendingValidationTimer = debounce(this, 'validateSourceModelSync', 500);
    this.set('pendingValidationTimer', pendingValidationTimer);
  },

  validateSourceModelSync() {
    let edmMetadata;
    // TODO: VFS-11911 try to optimize: update model, do not create new model instance
    try {
      if (this.checkAceErrors()) {
        this.setModelXmlSyncState(EdmModelXmlSyncState.NotParseable);
        return;
      }
      edmMetadata = EdmMetadataFactory.fromXml(this.currentXmlValue);
      this.configureNotAcceptedSourceValidator(edmMetadata);
      this.setModelXmlSyncState(EdmModelXmlSyncState.Parseable);
    } catch (error) {
      if (!(error instanceof InvalidEdmMetadataXmlDocument)) {
        throw error;
      }
      this.setModelXmlSyncState(EdmModelXmlSyncState.NotParseable);
    }
  },

  acceptXml() {
    this.replaceModelUsingCurrentXml();
    this.replaceCurrentXmlValueUsingModel();
    this.setModelXmlSyncState(EdmModelXmlSyncState.Synced);
  },

  discardXml() {
    this.changeSource(this.acceptedXmlValue);
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
        const factory = new EdmMetadataFactory();
        factory.shareRootFile = this.shareRootFile;
        const newModel = factory.createInitialMetadata();
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

  setModelXmlSyncState(newState) {
    if (this.modelXmlSyncState !== newState) {
      this.set('modelXmlSyncState', newState);
    }
  },

  setIsXmlValueInvalid(isInvalid = true) {
    this.set('isXmlValueInvalid', isInvalid);
    if (isInvalid) {
      this.setModelXmlSyncState(EdmModelXmlSyncState.NotParseable);
    }
  },

  /**
   * @param {EdmMetadata} edmMetadata
   */
  configureNotAcceptedSourceValidator(edmMetadata) {
    this.notAcceptedSourceValidator.set('edmMetadata', edmMetadata);
  },

  scrollTop() {
    if (this.element) {
      scrollTopClosest(this.element);
    }
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
      if (this.isPublished) {
        this.onChangeEditMode(false);
        this.initMetadataModel();
        this.scrollTop();
      } else {
        this.onBack();
      }
    },
    async submit() {
      this.set('isSaving', true);
      try {
        if (this.isPublished) {
          await this.submitMetadataUpdate();
          this.scrollTop();
        } else {
          await this.submit();
        }
      } finally {
        safeExec(this, 'set', 'isSaving', false);
      }
    },
    acceptXml() {
      this.acceptXml();
    },
    discardXml() {
      this.discardXml();
    },
    handleRepresentativeImageError(error) {
      this.set('representativeImageError', error);
    },
    startModify() {
      if (this.isModifyingExistingMetadata) {
        return;
      }
      this.onChangeEditMode(true);
      const metadata = this.visualEdmViewModel.edmMetadata;
      const webResource = metadata.edmObjects.find(obj =>
        obj.edmObjectType === EdmObjectType.WebResource
      );
      const fileSizeProperty = webResource?.edmProperties.find(property =>
        property.xmlTagName === 'dcterms:extent'
      );
      if (fileSizeProperty) {
        const oldValue = fileSizeProperty.getSupportedValue();
        const propertyFactory =
          new EdmPropertyFactory(metadata, EdmObjectType.WebResource);
        propertyFactory.shareRootFile = this.shareRootFile;
        propertyFactory.setDefaultValue(fileSizeProperty);
        if (oldValue !== fileSizeProperty.getSupportedValue()) {
          this.visualEdmViewModel.updateView();
          this.visualEdmViewModel.markAsModified();
        }
      }
    },
  },
});
