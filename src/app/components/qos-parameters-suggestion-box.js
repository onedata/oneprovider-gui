import Component from '@ember/component';
import { get } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { equal, conditional, raw, array } from 'ember-awesome-macros';

const customComputedValue = raw([{ isCustom: true }]);

export default Component.extend(I18n, {
  classNames: ['qos-parameters-suggestion-box'],
  classNameBindings: [
    'selectedSuggestion:box-width-all',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.qosParametersSuggestionBox',

  /**
   * @virtual
   * @type {Array<QosParameterSuggestion>}
   */
  qosParametersSuggestions: undefined,

  selectedSuggestion: undefined,

  selectedOperator: '=',

  selectedValue: undefined,

  availableValues: array.concat(conditional(
    equal('selectedOperator', raw('=')),
    'selectedSuggestion.allValues',
    'selectedSuggestion.numberValues',
  ), customComputedValue),

  /**
   * @virtual
   * @type {(text: String) => undefined}
   */
  insertString: undefined,

  createConditionString(key, operator, value) {
    return `${key}${operator ? (value ? `${operator}${value}` : operator) : ''}`;
  },

  actions: {
    insert() {
      const {
        selectedSuggestion,
        selectedOperator: operator,
        selectedValue: value,
        insertString,
      } = this.getProperties(
        'selectedSuggestion',
        'selectedOperator',
        'selectedValue',
        'insertString',
      );
      const key = get(selectedSuggestion, 'key');

      const stringValue = value && value.isCustom ? this.t('custom') : value;
      insertString(this.createConditionString(
        key,
        operator,
        stringValue
      ));
      this.setProperties({
        selectedSuggestion: null,
        selectedOperator: '=',
        selectedValue: null,
      });
    },
    keyMatcher(model, term) {
      const name = get(model, 'key').toLocaleLowerCase();
      return name.includes(term.toLocaleLowerCase()) ? 1 : -1;
    },
    changeSelectedSuggestion(selectedSuggestion) {
      this.setProperties({
        selectedSuggestion,
        selectedOperator: '=',
        selectedValue: null,
      });
    },
  },
});
