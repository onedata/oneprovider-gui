/**
 * Gathers user input to fill in workflow execution options.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { tag, not } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import DropdownField from 'onedata-gui-common/utils/form-component/dropdown-field';
import { translateEntrySeverity, EntrySeverity, entrySeveritiesArray } from 'onedata-gui-common/utils/audit-log';

export default Component.extend(I18n, {
  classNames: ['execution-options-form'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.executionOptionsForm',

  /**
   * @virtual optional
   * @type {Boolean}
   */
  isDisabled: false,

  /**
   * @virtual optional
   * @type {((data: Object) => void) | null}
   */
  onChange: null,

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormFieldsRootGroup}
   */
  form: computed(function form() {
    return Form.create({ component: this });
  }),

  /**
   * @returns {void}
   */
  propagateValueChange() {
    const valuesDump = this.form.dumpValue();
    this.onChange?.({
      logLevel: valuesDump.logLevel,
    });
  },
});

const Form = FormFieldsRootGroup.extend({
  /**
   * @override
   */
  i18nPrefix: tag`${'component.i18nPrefix'}.form`,

  /**
   * @virtual
   * @type {Components.SpaceAutomation.ExecutionOptionsForm}
   */
  component: undefined,

  /**
   * @override
   */
  ownerSource: reads('component'),

  /**
   * @override
   */
  isEnabled: not('component.isDisabled'),

  /**
   * @override
   */
  fields: computed(() => [
    LoggingLevelField.create(),
  ]),

  /**
   * @override
   */
  onValueChange() {
    this._super(...arguments);
    scheduleOnce('afterRender', this.component, 'propagateValueChange');
  },
});

const LoggingLevelField = DropdownField.extend({
  /**
   * @override
   */
  options: computed(function options() {
    return entrySeveritiesArray.map((severity) => ({
      value: severity,
      label: translateEntrySeverity(this.i18n, severity),
    }));
  }),

  /**
   * @override
   */
  name: 'logLevel',

  /**
   * @override
   */
  defaultValue: EntrySeverity.Info,

  /**
   * @override
   */
  showSearch: false,
});
