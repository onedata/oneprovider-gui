/**
 * A box with selection of available QoS parameter keys with their known value
 * 
 * @module components/qos-parameters-suggestion-box
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { equal, conditional, raw, array } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { scheduleOnce } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, {
  classNames: ['qos-parameters-suggestion-box'],

  /**
   * @override
   */
  i18nPrefix: 'components.qosParametersSuggestionBox',

  /**
   * @virtual
   * @type {Array<QosParameterSuggestion>}
   */
  qosParametersSuggestions: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  refreshContainer: notImplementedIgnore,

  /**
   * @virtual
   * @type {(text: String) => undefined}
   */
  insertString: undefined,

  selectedSuggestion: undefined,

  selectedOperator: '=',

  selectedValue: undefined,

  availableOperators: reads('selectedSuggestion.availableOperators'),

  availableValues: array.concat(conditional(
    equal('selectedOperator', raw('=')),
    'selectedSuggestion.allValues.[]',
    'selectedSuggestion.numberValues.[]',
  ), raw([{ isCustom: true }])),

  customText: computedT('custom'),

  qosParametersSuggestionsObserver: observer(
    'qosParametersSuggestions.[]',
    function qosParametersSuggestionsObserver() {
      const {
        selectedSuggestion,
        qosParametersSuggestions,
      } = this.getProperties(
        'selectedSuggestion',
        'qosParametersSuggestions'
      );
      const matchingSuggestion =
        qosParametersSuggestions && selectedSuggestion &&
        qosParametersSuggestions.findBy('key', get(selectedSuggestion, 'key'));
      if (!matchingSuggestion) {
        this.setProperties({
          selectedSuggestion: null,
          selectedOperator: '=',
          selectedValue: null,
        });
      } else if (selectedSuggestion && matchingSuggestion !== selectedSuggestion) {
        this.set('selectedSuggestion', matchingSuggestion);
      }
    }
  ),

  selectedSuggestionObserver: observer(
    'selectedSuggestion',
    function selectedSuggestionObserver() {
      const {
        selectedSuggestion,
        refreshContainer,
      } = this.getProperties('selectedSuggestion', 'refreshContainer');
      this.clearSelectedValueIfNotFound();
      this.clearSelectedOperatorIfNotFound();
      if (selectedSuggestion === null) {
        scheduleOnce('afterRender', () => {
          safeExec(this, () => refreshContainer());
        });
      }
    }
  ),

  selectedOperatorObserver: observer(
    'selectedOperator',
    function selectedOperatorObserver() {
      this.clearSelectedValueIfNotFound();
    }
  ),

  availableValuesObserver: observer(
    'availableValues.[]',
    function availableValuesObserver() {
      this.clearSelectedValueIfNotFound();
    }
  ),

  clearSelectedValueIfNotFound() {
    const {
      availableValues,
      selectedValue,
    } = this.getProperties(
      'availableValues',
      'selectedValue'
    );
    if (selectedValue && !availableValues.includes(selectedValue)) {
      this.set('selectedValue', null);
    }
  },

  clearSelectedOperatorIfNotFound() {
    const {
      availableOperators,
      selectedOperator,
    } = this.getProperties(
      'availableOperators',
      'selectedOperator'
    );
    if (selectedOperator && !availableOperators.includes(selectedOperator)) {
      this.set('selectedOperator', '=');
    }
  },

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
        customText,
      } = this.getProperties(
        'selectedSuggestion',
        'selectedOperator',
        'selectedValue',
        'insertString',
        'customText',
      );
      const key = get(selectedSuggestion, 'key');

      const stringValue = value && value.isCustom ? customText.string : value;
      const conditionString = this.createConditionString(
        key,
        operator,
        stringValue
      );
      insertString(
        conditionString,
        value && value.isCustom ? conditionString.length - stringValue.length : undefined
      );
    },
    keyMatcher(model, term) {
      const name = get(model, 'key').toLocaleLowerCase();
      return name.includes(term.toLocaleLowerCase()) ? 1 : -1;
    },
    changeSelectedSuggestion(selectedSuggestion) {
      this.set('selectedSuggestion', selectedSuggestion);
    },
  },
});
