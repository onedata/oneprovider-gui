/**
 * Renders `a <operator> b` part of expression, where a and b can be any element
 * of expression (see `qos-expression-viever/*` components)
 * 
 * @module components/qos-expression-viewer/qos-group
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Object}
   * Object of 
   */
  data: undefined,
});
