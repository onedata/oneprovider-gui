/**
 * Renders `<not_operator> a` part of expression, where a can be any element
 * of expression (see `qos-expression-viever/*` components)
 * 
 * @module components/qos-expression-viewer/qos-not
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { operatorChar } from 'oneprovider-gui/utils/qos-rpn-to-object';
import { notEqual, raw } from 'ember-awesome-macros';

export default Component.extend({
  tagName: '',

  data: undefined,

  operatorString: operatorChar['not'],

  brackets: notEqual('data.a.type', raw('pair')),
});
