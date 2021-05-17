import Component from '@ember/component';
import { computed, getProperties } from '@ember/object';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import TextField from 'onedata-gui-common/utils/form-component/text-field';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import ToggleField from 'onedata-gui-common/utils/form-component/toggle-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not } from 'ember-awesome-macros';
import { scheduleOnce } from '@ember/runloop';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings.form',

  /**
   * @virtual
   */
  onChange: notImplementedIgnore,

  // FIXME:
  isSubmitting: false,

  init() {
    this._super(...arguments);
    this.get('onChange')();
  },

  notifyAboutChange() {
    safeExec(this, () => {
      const {
        rootFieldGroup,
        onChange,
      } = this.getProperties('rootFieldGroup', 'onChange');

      const {
        isValid,
        invalidFields,
      } = getProperties(rootFieldGroup, 'isValid', 'invalidFields');

      onChange({
        formData: rootFieldGroup.dumpValue(),
        isValid,
        invalidFields: invalidFields.mapBy('valuePath'),
      });
    });
  },

  rootFieldGroup: computed(function mainFieldGroup() {
    const component = this;
    return FormFieldsRootGroup
      .extend({
        ownerSource: reads('component'),
        i18nPrefix: tag `${'component.i18nPrefix'}.settingsForm`,
        isEnabled: not('component.isSubmitting'),
        onValueChange() {
          this._super(...arguments);
          scheduleOnce('afterRender', component, 'notifyAboutChange');
        },
      })
      .create({
        component,
        fields: [
          TextField.create({
            name: 'description',
            defaultValue: '',
            isOptional: true,
          }),
          FormFieldsGroup.create({
            name: 'config',
            fields: [
              ToggleField.create({
                name: 'incremental',
                defaultValue: false,
              }),
              RadioField.create({
                name: 'layout',
                defaultValue: 'plain',
                options: [
                  { value: 'plain' },
                  { value: 'bagit' },
                ],
              }),
              ToggleField.create({
                name: 'includeDip',
                defaultValue: false,
              }),
            ],
          }),
          TextField.create({
            name: 'preservedCallback',
            defaultValue: '',
            isOptional: true,
          }),
          TextField.create({
            name: 'purgedCallback',
            defaultValue: '',
            isOptional: true,
          }),
        ],
      });
  }),

  canSubmit: reads('rootFieldGroup.isValid'),

  willDestroyElement() {
    this._super(...arguments);
    this.get('rootFieldGroup').destroy();
  },

  async submit() {
    const {
      canSubmit,
      rootFieldGroup,
      onSubmit,
    } = this.getProperties('canSubmit', 'rootFieldGroup', 'onSubmit');
    if (canSubmit) {
      const formValues = rootFieldGroup.dumpValue();
      console.dir('FIXME: submit', formValues);
      return onSubmit(formValues);
    }
  },

  actions: {
    submit() {
      return this.submit();
    },
  },
});
