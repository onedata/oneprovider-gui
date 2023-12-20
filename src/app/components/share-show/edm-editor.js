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
  xml: undefined,

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

  isEmpty: not('xml'),

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
    return this.onSubmit(this.xml);
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
