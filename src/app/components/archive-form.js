/**
 * Form with settings for archive model
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

/**
 * @typedef {Object} ArchiveFormOptions
 * @property {archiveDetailsInitialTab} initialTab
 * @property {boolean} [focusDescription]
 */

/**
 * @typedef {Object} ArchiveFormOptions
 * @property {boolean} [focusDescription] If true, description textarea is focused
 *   on component init.
 */

/**
 * @typedef {ArchiveFormOptions} ArchivePropertiesTabOptions
 */

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component', 'archive-form'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveForm',

  /**
   * @virtual
   * @type {Utils.ArchiveForm.BaseModel}
   */
  formModel: undefined,

  /**
   * @virtual optional
   * @type {ArchiveFormOptions}
   */
  options: Object.freeze({
    focusDescription: false,
  }),

  /**
   * Set to true, to indicate that form submit is in progress
   * @virtual optional
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @virtual
   * @type {({ formData: EmberObject, isValid: Boolean }) => any}
   */
  onChange: notImplementedIgnore,

  rootFieldGroup: reads('formModel.rootFieldGroup'),
});
