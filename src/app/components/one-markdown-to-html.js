/**
 * Wrapper component for showdown.js Markdown to HTML converter with DOMPurify sanitizer
 * 
 * @module components/one-markdown-to-html
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import showdown from 'npm:showdown';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';
import { computed } from '@ember/object';
import DOMPurify from 'npm:dompurify';

export default Component.extend({
  classNames: ['one-markdown-to-html'],

  /**
   * A Markdown-formatted text to show converted to HTML
   * @virtual
   * @type {String}
   */
  markdown: undefined,

  /**
   * Options for showdown converter.
   * Immutable - does not watch for changes in properties.
   * Set always a new object!
   * @type {Object}
   */
  options: Object.freeze({
    tables: true,
    strikethrough: true,
    literalMidWordUnderscores: true,
    simplifiedAutoLink: true,
    openLinksInNewWindow: true,
  }),

  converter: computed('options', function converter() {
    return new showdown.Converter(this.get('options'));
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  html: computed('markdown', 'converter', function html() {
    const {
      markdown,
      converter,
    } = this.getProperties('markdown', 'converter');
    return this.sanitize(converter.makeHtml(markdown));
  }),

  sanitize(htmlContent) {
    DOMPurify.addHook('afterSanitizeAttributes', sanitizeLinksTarget);
    const output = htmlSafe(
      DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['target'] }).toString()
    );
    DOMPurify.removeHook('afterSanitizeAttributes');
    return output;
  },
});

/**
 * From example:
 * https://github.com/cure53/DOMPurify/blob/main/demos/README.md#hook-to-open-all-links-in-a-new-window-link
 * 
 * @param {HTMLElement} node
 */
function sanitizeLinksTarget(node) {
  // set all elements owning target to target=_blank
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
  // set non-HTML/MathML links to xlink:show=new
  if (
    !node.hasAttribute('target') &&
    (node.hasAttribute('xlink:href') || node.hasAttribute('href'))
  ) {
    node.setAttribute('xlink:show', 'new');
  }
}
