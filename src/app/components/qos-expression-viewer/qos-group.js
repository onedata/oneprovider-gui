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
import { tag } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { getBy } from 'ember-awesome-macros';
import { operatorChar } from 'oneprovider-gui/utils/qos-rpn-to-object';

export default Component.extend({
  tagName: '',

  data: undefined,

  operatorChar,

  operatorClass: tag `qos-group-${'data.operator'}`,

  operatorStringClass: tag `qos-group-operator-${'data.operator'}`,

  operatorString: getBy('operatorChar', 'data.operator'),

  brackets: reads('data.brackets'),
});
