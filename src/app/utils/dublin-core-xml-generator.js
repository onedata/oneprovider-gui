/**
 * Generates Dublin Core Metadata in XML/RDF format and exposes metadata in convenient
 * formats.
 * 
 * Supports only Dublin Core version 1.1.
 * 
 * @module utils/dublin-core-xml-parser
 * @author Jakub Liput
 * @copyright (C) 2020-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import Ember from 'ember';

// Cannot import this util gracefully
// https://github.com/emberjs/ember.js/issues/16817
const escape = Ember.Handlebars.Utils.escapeExpression;

export default EmberObject.extend({
  /**
   * Types can be ones from Dublin Core Metadata Element Set, Version 1.1.
   * There should be one array element for one type.
   * There can be one or multiple values for each type.
   * Empty values make no sense but are accepted.
   * 
   * Example:
   * ```
   * [
   *   { type: 'title', values: ['Hello', 'World'] },
   *   { type: 'creator', values: ['John Smith'] }
   * ]
   * ```
   * 
   * @virtual
   * @type {Array<{ type: String, values: Array<String>}>}
   */
  groupedEntries: undefined,

  entries: computed('groupedEntries', function entries() {
    const groupedEntries = this.get('groupedEntries');
    return groupedEntries.reduce((arr, group) => {
      const { type, values } = group;
      values.forEach(value => {
        arr.push({ type, value });
      });
      return arr;
    }, []);
  }),

  xml: computed('xml', function xml() {
    const entries = this.get('entries');
    const content = entries.reduce((arr, entry) => {
      arr.push(`<dc:${entry.type}>${escape(entry.value)}</dc:${entry.type}>`);
      return arr;
    }, []).map(xmlEntry => `    ${xmlEntry}`).join('\n');
    return this.wrapXmlContent(content);
  }),

  wrapXmlContent(content) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dc="http://purl.org/dc/elements/1.1/">
${content}
</metadata>
`;
  },

  /**
   * Remove entries that are not necessary (give no additional data).
   * @param {Boolean} removeEmptyValues if true, entries with empty string will be removed
   */
  cleanEmpty(removeEmptyValues = true) {
    const groupedEntries = this.get('groupedEntries');
    const stripped = groupedEntries.reduce((arr, entry) => {
      const strippedValues = removeEmptyValues ?
        entry.values.filter(value => Boolean(value)) : [...entry.values];
      if (strippedValues.length > 0) {
        arr.push({ type: entry.type, values: strippedValues });
      }
      return arr;
    }, []);
    this.set('groupedEntries', stripped);
  },
});
