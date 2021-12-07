import Component from '@ember/component';

export default Component.extend({
  tagName: 'tr',
  classNames: ['events-table-event-row', 'data-row'],
  attributeBindings: ['rowIndex:data-row-id'],

  /**
   * @virtual
   * @type {}
   */
  eventData: undefined,

  /**
   * @virtual
   * @type {string}
   */
  rowIndex: undefined,
});
