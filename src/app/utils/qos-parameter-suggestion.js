/**
 * Representation of single available QoS parameter with its values
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import { raw, or, and, array, writable } from 'ember-awesome-macros';

/**
 * @implements {QueryProperty}
 */
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
   * One of: stringOptions, numberOptions, mixedOptions
   * @virtual optional
   * @type {ComputedProperty<string>}
   */
  type: writable(or(
    'injectedType',
    and('stringValues.length', 'numberValues.length', raw('mixedOptions')),
    and('numberValues.length', raw('numberOptions')),
    raw('stringOptions'),
  ), {
    set(value) {
      return this.injectedType = value;
    },
  }),

  /**
   * @type {string | null}
   */
  injectedType: null,

  /**
   * Key that should be displayed in GUI - by default is the same as key,
   * but in some cases a special key should be used
   * @type {ComputedProperty<String>|String}
   */
  displayedKey: reads('key'),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  allValues: array.concat('numberValues', 'stringValues'),
});
