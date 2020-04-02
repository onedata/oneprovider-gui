/**
 * Visual test component for qos-expression-viewer
 * 
 * @module components/dummy-qos-expression-viewer
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  expressionRpn: Object.freeze(['a=b', 'c=d', '|', '-', 'x=y', '&', 'z=v', '|']),
});
