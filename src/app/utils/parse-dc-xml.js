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
  xmlSource: undefined,

  xmlParser: computed(() => new DOMParser()),

  xmlDoc: computed('xmlSource', 'xmlParser', function xmlDoc() {
    const {
      xmlParser,
      xmlSource,
    } = this.getProperties('xmlParser', 'xmlSource');
    return xmlParser.parseFromString(xmlSource, 'text/xml');
  }),

  entries: computed('xmlDoc', function entries() {
    // FIXME: parse malformed XML without namespace specified
    // const xmlDoc = this.get('xmlDoc');
    // dcElements.reduce((allEntries, type) => {
    //   allEntries.push(...Array.from(xmlDoc.getElementsByTagName(`dc:${type}`)));
    //   return allEntries;
    // }, []);
    return Array.from(this.get('xmlDoc').querySelectorAll(allElementsSelector))
      .map(node => ({
        type: node.nodeName.split('dc:')[1],
        value: node.childNodes[0].nodeValue,
      }));
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
