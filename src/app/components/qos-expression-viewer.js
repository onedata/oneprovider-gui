/**
 * A contaniner for creating tokenized and stylized view of QoS logical expression
 * 
 * @module components/qos-expression-viewer
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import qosRpnToQueryBlock from 'oneprovider-gui/utils/qos-rpn-to-query-block';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['qos-expression-viewer'],

  /**
   * RPN representation of QoS expression, eg.
   *`["storage", "sda", "=", "speed", "40", "=", "|"]`
   * @virtual
   * @type {Array<String>}
   */
  expressionRpn: undefined,

  /**
   * Root object of expression tree, one of expression part objects
   * @type {ComputedProperty<Utils.RootOperatorQueryBlock>}
   */
  rootQueryBlock: computed('expressionRpn', function rootQueryBlock() {
    const expressionRpn = this.get('expressionRpn');
    try {
      return qosRpnToQueryBlock(expressionRpn);
    } catch (error) {
      // this error report is silent, because it can be multiple recomputations of this
      // property and there shouldn't be too much side effect
      console.error(
        `component:qos-expression-viewer#rootQueryBlock: ${error}; RPN: ${JSON.stringify(expressionRpn)}`
      );
      return null;
    }
  }),
});
