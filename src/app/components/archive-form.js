/**
 * Form with settings for archive model
 *
 * @module components/archive-form
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, observer } from '@ember/object';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import TextareaField from 'onedata-gui-common/utils/form-component/textarea-field';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import ToggleField from 'onedata-gui-common/utils/form-component/toggle-field';
import StaticTextField from 'onedata-gui-common/utils/form-component/static-text-field';
import SiblingLoadingField from 'onedata-gui-common/utils/form-component/sibling-loading-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not, or, raw, conditional, and, equal } from 'ember-awesome-macros';
import { scheduleOnce } from '@ember/runloop';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component', 'archive-form'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveForm',

  /**
   * @virtual
   * @type {({ formData: EmberObject, isValid: Boolean }) => any}
   */
  onChange: notImplementedIgnore,

  /**
   * Set to true, to indicate that form submit is in progress
   * @virtual optional
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @type {ArchiveFormModel}
   */
  formModel: undefined,

  rootFieldGroup: reads('formModel.rootFieldGroup'),

  // FIXME: proxy from model
  /**
   * @virtual
   * @type {PromiseObject<Utils.BrowsableArchive>}
   */
  baseArchiveProxy: undefined,

  // FIXME: move into create model only
  /**
   * @virtual
   * @type {() => PromiseObject<Utils.BrowsableArchive>}
   */
  updateBaseArchiveProxy: undefined,

  notifyAboutChange() {
    safeExec(this, () => {
      const {
        rootFieldGroup,
        onChange,
      } = this.getProperties('rootFieldGroup', 'onChange');

      const isValid = get(rootFieldGroup, 'isValid');

      onChange({
        formData: rootFieldGroup.dumpValue(),
        isValid,
      });
    });
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    this.get('formModel').destroy();
  },
});
