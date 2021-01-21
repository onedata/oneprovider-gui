import EmberObject, { computed } from '@ember/object';
import Ember from 'ember';

const escape = Ember.Handlebars.Utils.escapeExpression;

export default EmberObject.extend({
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
    }, []).map(xmlEntry => `    ${xmlEntry}\n`).join('');
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
