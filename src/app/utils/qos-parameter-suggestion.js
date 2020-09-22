/**
 * Representation of single available QoS parameter with its values
 * 
 * @module utils/qos-parameters-suggestion
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { getBy, raw, or, and, array } from 'ember-awesome-macros';

const allOperators = ['=', '<', '<=', '>=', '>'];

const operators = {
  string: ['='],
  number: allOperators,
  mixed: allOperators,
};

export default EmberObject.extend({
  /**
   * @virtual
   * @type {String}
   */
  key: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  stringValues: undefined,

  /**
   * @virtual
   * @type {Array<Number>}
   */
  numberValues: undefined,

  /**
   * One of: string, number, mixed
   * @type {ComputedProperty<string>}
   */
  type: or(
    and('stringValues.length', 'numberValues.length', raw('mixed')),
    and('numberValues.length', raw('number')),
    raw('string'),
  ),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  allValues: array.concat('numberValues', 'stringValues'),

  /**
   * Array of operators available for value comparison for the key
   * @type {ComputedProperty<Array<String>>}
   */
  availableOperators: getBy(raw(operators), 'type'),
});
