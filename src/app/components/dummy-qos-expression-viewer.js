/**
 * Visual test component for qos-expression-viewer
 * 
 * @module components/dummy-qos-expression-viewer
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import _ from 'lodash';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-expression-converters';

export default Component.extend({
  classNames: ['dummy-component'],
  expressionRpnSimple: Object.freeze(['a=b', 'c=d', '|', 'x=y', '&', 'z=v', '|']),
  expressionRpn: Object.freeze(
    ['a=b', ..._.flatten(_.times(30, _.constant(['e=f', '|'])))]
  ),

  rawExpressionInfix: computedPipe('expressionRpn', qosRpnToInfix),

  init() {
    this._super(...arguments);
    console.dir(this.get('expressionRpn'));
  },
});
