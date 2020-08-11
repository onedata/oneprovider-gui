/**
 * Renders `key <operator> value` part of expression, where the operator can be one of
 * `=`, `<`, `>`, `<=`, `>=`
 * 
 * @module components/qos-expression-viewer/qos-pair
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { pairOperatorChar } from 'oneprovider-gui/utils/qos-expression-converters';
import { tag } from 'ember-awesome-macros';
import { getBy } from 'ember-awesome-macros';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Object}
   * Object of 
   */
  data: undefined,

  pairOperatorChar,

  operatorStringClass: tag `qos-pair-operator-${'data.operator'}`,

  operatorString: getBy('pairOperatorChar', 'data.operator'),
});
