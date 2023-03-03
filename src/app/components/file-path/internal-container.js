/**
 * A direct container for path elements, created to have flexible tag names.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { eq, raw, conditional } from 'ember-awesome-macros';

export default Component.extend({
  tagName: 'a',

  attributeBindings: [
    'href',
    'target',
    'onclick',
    'onkeydown',
  ],

  isLink: eq('tagName', raw('a')),

  /**
   * @virtual
   * @type {String}
   */
  linkTarget: undefined,

  /**
   * @virtual
   * @type {String}
   */
  linkHref: undefined,

  href: conditional(
    'isLink',
    'linkHref',
    raw(undefined)
  ),

  target: conditional(
    'isLink',
    'linkTarget',
    raw(undefined)
  ),

  onclick: conditional(
    'isLink',
    'onLinkClicked',
    raw(undefined),
  ),

  onkeydown: conditional(
    'isLink',
    'onKeydown',
    raw(undefined)
  ),
});
