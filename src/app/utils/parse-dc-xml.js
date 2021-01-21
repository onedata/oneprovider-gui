/**
 * Parses Dublin Core Metadata in XML/RDF format and exposes metadata in convenient
 * formats.
 * 
 * @module utils/parse-dc-xml
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { A } from '@ember/array';

export const dcElements = [
  'title',
  'creator',
  'contributor',
  'subject',
  'description',
  'publisher',
  'date',
  'type',
  'format',
  'identifier',
  'source',
  'language',
  'relation',
  'coverage',
  'rights',
];

const allElementsSelector = dcElements.map(name => `${name}`).join(',');

export default EmberObject.extend({
  /**
   * @virtual
   * @type {String}
   */
  xmlSource: undefined,

  /**
   * If set to true, DC entries with empty string will be exposed in entries.
   * Eg. `<dc:creator></dc:creator>` will be available as
   * `{ type: 'creator', value: '' }`.
   * @type {Boolean}
   */
  preserveEmptyValues: false,

  /**
   * @type {ComputedProperty<DOMParser>}
   */
  xmlParser: computed(() => new DOMParser()),

  /**
   * @type {ComputedProperty<Document>}
   */
  xmlDoc: computed('xmlSource', 'xmlParser', function xmlDoc() {
    const {
      xmlParser,
      xmlSource,
    } = this.getProperties('xmlParser', 'xmlSource');
    return xmlParser.parseFromString(xmlSource, 'text/xml');
  }),

  /**
   * @type {ComputedProperty<Array<{type: String, value: String}>>}
   */
  entries: computed('xmlDoc', function entries() {
    // TODO: VFS-6566 parse malformed XML without namespace specified
    // const xmlDoc = this.get('xmlDoc');
    // dcElements.reduce((allEntries, type) => {
    //   allEntries.push(...Array.from(xmlDoc.getElementsByTagName(`dc:${type}`)));
    //   return allEntries;
    // }, []);
    const {
      xmlDoc,
      preserveEmptyValues,
    } = this.getProperties('xmlDoc', 'preserveEmptyValues');
    const allEntries = Array.from(xmlDoc.querySelectorAll(allElementsSelector))
      .map(node => ({
        type: node.nodeName.split('dc:')[1],
        value: node.childNodes[0] && node.childNodes[0].nodeValue || '',
      }));
    return preserveEmptyValues ? allEntries : allEntries.filter(entry => entry.value);
  }),

  groupedEntries: computed('entries.[]', function groupedEntries() {
    const order = [];
    const cache = {};
    this.get('entries').forEach(entry => {
      const { type, value } = entry;
      if (cache[type]) {
        cache[type].push(value);
      } else {
        cache[type] = [value];
        order.push(type);
      }
    });
    return order.map(type => ({ type, values: cache[type] }));
  }),

  getEmberGroupedEntries() {
    const groupedEntries = this.get('groupedEntries');
    return A(groupedEntries.map(group => {
      return EmberObject.create({
        type: group.type,
        values: A(group.values),
      });
    }));
  },
});
