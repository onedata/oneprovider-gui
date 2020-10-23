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
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';

export default Component.extend({
  classNames: ['qos-expression-viewer'],

  /**
   * @virtual
   * @type {Array<String>}
   * RPN representation of QoS expression, eg.
   * `["storage", "sda", "=", "speed", "40", "=", "|"]`
   */
  expressionRpn: undefined,

  /**
   * @type {ComputedProperty<Utils.RootOperatorQueryBlock>}
   * Root object of expression tree, one of expression part objects
   */
  rootQueryBlock: computedPipe('expressionRpn', qosRpnToQueryBlock),
});
