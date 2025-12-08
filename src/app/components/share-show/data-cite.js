/**
 * Edit or view XML of DataCite share handle metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2025 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import Locale from 'onedata-gui-common/utils/locale';
import { tracked } from '@glimmer/tracking';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import moment from 'moment';

/**
 * @typedef {Object} DataCiteSignature
 * @property {HTMLDivElement} Element
 * @property {DataCiteArgs} Args
 */

/**
 * @typedef {Object} DataCiteArgs
 * @property {string} xmlValue
 * @property {Models.Space} [space] Needed only in private views.
 * @property {boolean} [isReadOnly]
 * @property {boolean} [isPublished]
 * @property {boolean} [isPublicView]
 * @property {Models.HandleService} [handleService]
 * @property {import('./pane-publicdata').PublicDataInitialMetadata} initialData
 * @property {(metadataXml: string) => Promise} [onModify]
 * @property {(xml: string) => void} [onUpdateXml]
 * @property {(metadataXml: string) => Promise} [onSubmit]
 * @property {() => void} [onBack]
 * @property {(isEditMode: boolean) => void} [onChangeEditMode]
 */

/**
 * @extends {Component<DataCiteSignature>}
 */
export default class DataCiteComponent extends Component {
  @service media;
  @service i18n;

  locale = new Locale('components.shareShow.dataCite');

  //#region state

  /** @type {string} */
  @tracked
  currentXmlValue = '';

  /** @type {boolean} */
  @tracked
  isValid = false;

  /** @type {Ace.Editor} */
  aceEditor;

  //#endregion

  constructor() {
    super(...arguments);
    if (this.editMode === 'create') {
      this.currentXmlValue = this.generateInitialXml(this.args.initialData);
    } else {
      this.currentXmlValue = this.args.xmlValue ?? '';
    }

  }

  get xmlValue() {
    return this.args.xmlValue ?? null;
  }

  get isReadOnly() {
    return this.args.isReadOnly ?? false;
  }

  get isPublished() {
    return this.args.isPublished ?? false;
  }

  get isPublicView() {
    return this.args.isPublicView ?? false;
  }

  get isIntroVisible() {
    return !this.isReadOnly && !this.media.isMobile;
  }

  get handleService() {
    return this.args.handleService;
  }

  get initialData() {
    return this.args.initialData;
  }

  get onChangeEditMode() {
    return this.args.onChangeEditMode;
  }

  get onModify() {
    return this.args.onModify;
  }

  get onUpdateXml() {
    return this.args.onUpdateXml;
  }

  get onSubmit() {
    return this.args.onSubmit;
  }

  get onBack() {
    return this.args.onBack;
  }

  /**
   * @type {import('./pane-publicdata').MetadataEditorEditMode}
   */
  get editMode() {
    if (this.isReadOnly) {
      return 'show';
    }
    return this.isPublished ? 'edit' : 'create';
  }

  get isModifyButtonShown() {
    return !this.isPublicView && (this.editMode === 'show' || this.editMode === 'edit');
  }

  get isModifyDisabled() {
    return Boolean(this.modifyDisabledTip);
  }

  get hasManageSharesPrivilege() {
    // space is optional in readonly mode
    return this.args.space?.privileges.manageShares;
  }

  get modifyDisabledTip() {
    if (this.isModifyingExistingMetadata) {
      return this.locale.t('modifyingButtonTip');
    }
    if (!this.hasManageSharesPrivilege) {
      return insufficientPrivilegesMessage({
        i18n: this.i18n,
        modelName: 'space',
        privilegeFlag: 'space_manage_shares',
      });
    }
    return undefined;
  }

  get colClassname() {
    const basicClass = 'col-xs-12 col-md-8 ';
    return basicClass + (this.isReadOnly ? 'col-lg-7' : ' col-centered');
  }

  get isModifyingExistingMetadata() {
    return this.isPublished && !this.isReadOnly;
  }

  get isSubmitDisabled() {
    return Boolean(this.submitDisabledReason);
  }

  get submitDisabledReason() {
    if (!this.currentXmlValue) {
      return this.locale.t('validation.empty');
    }
    if (!this.isValid) {
      return this.locale.t('validation.xmlInvalid');
    }
    return undefined;
  }

  get isPublicDataLogoShown() {
    return this.isReadOnly && !this.media.isMobile && !this.media.isTablet;
  }

  /**
   * @param {Ace.Editor} aceEditor
   */
  setupAceEditor(aceEditor) {
    // TODO: VFS-11950 Make this hack global (ACE editor wrapper)
    const aceSession = aceEditor.getSession();
    // optional chaining, because tests has specific ACE editor replacement
    aceSession.getUndoManager?.().reset();
    this.aceEditor = aceEditor;
    this.onAnnotationChanged();
    aceSession.on('changeAnnotation', () => {
      this.onAnnotationChanged();
    });
  }

  onAnnotationChanged() {
    this.isValid = !this.areAceErrorsPresent();
  }

  /**
   * @param {import('./pane-publicdata').PublicDataInitialMetadata} initialData
   * @returns {string}
   */
  generateInitialXml(initialData = {}) {
    const { creator = '', title = '' } = initialData;
    const year = moment().format('YYYY');

    return `<?xml version="1.0" encoding="utf-8"?>
<!-- DataCite XML metadata; refer to: https://datacite-metadata-schema.readthedocs.io -->
<resource
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://datacite.org/schema/kernel-4"
  xsi:schemaLocation="http://datacite.org/schema/kernel-4 https://schema.datacite.org/meta/kernel-4/metadata.xsd"
>
    <creators>
        <creator>
            <creatorName>${creator}</creatorName>
        </creator>
    </creators>
    <titles>
      <title>${title}</title>
    </titles>
    <publisher>Example Publisher</publisher>
    <publicationYear>${year}</publicationYear>
    <resourceType resourceTypeGeneral="Dataset">Example Dataset</resourceType>
</resource>
    `;

  }

  areAceErrorsPresent() {
    // optional chaining, because tests has specific ACE editor replacement
    const annotations = this.aceEditor.getSession().getAnnotations?.();
    return Boolean(annotations?.some(annotation => annotation.type === 'error'));
  }

  @action
  startModify() {
    if (this.isModifyingExistingMetadata) {
      return;
    }
    this.onChangeEditMode(true);
  }

  @action
  aceEditorReady(aceEditor) {
    this.setupAceEditor(aceEditor);
  }

  @action
  sourceChanged(value) {
    this.currentXmlValue = value;
    // onUpdateXml could be not available in isReadOnly mode
    this.onUpdateXml?.(value);
  }

  @action
  back() {
    if (this.isPublished) {
      this.onChangeEditMode(false);
    } else {
      this.onBack();
    }
  }

  @action
  async submit() {
    this.isSaving = true;
    try {
      if (this.isPublished) {
        await this.onModify(this.currentXmlValue);
        this.onChangeEditMode(false);
      } else {
        await this.onSubmit(this.currentXmlValue);
      }
    } finally {
      this.isSaving = false;
    }
  }
}
