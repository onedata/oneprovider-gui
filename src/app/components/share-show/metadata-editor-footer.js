/**
 * Generic footer for Open Data metadata editor with some summary and submit button.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { equal } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['metadata-editor-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.metadataEditorFooter',

  //#region virtual

  /**
   * @virtual
   * @type {Models.HandleService}
   */
  handleService: undefined,

  /**
   * @virtual
   * @type {() => Promise}
   */
  onSubmit: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onCancel: undefined,

  /**
   * @type {MetadataEditorEditMode}
   */
  editMode: undefined,

  //#endregion

  //#region configuration

  /**
   * @virtual optional
   * @type {boolean}
   */
  isCancelDisabled: false,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isSubmitDisabled: false,

  /**
   * @virtual optional
   * @type {SafeString|string}
   */
  submitButtonTip: undefined,

  /**
   * @virtual optional
   * @type {SafeString|string}
   */
  cancelButtonTip: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isEditorModified: false,

  isCreateMode: equal('editMode', 'create'),

  //#endregion

  actions: {
    cancel() {
      this.onCancel();
    },
    submit() {
      return this.onSubmit();
    },
  },
});
