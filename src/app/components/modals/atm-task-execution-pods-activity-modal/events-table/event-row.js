import Component from '@ember/component';

export default Component.extend({
  tagName: 'tr',
  classNames: ['events-table-event-row'],

  /**
   * @virtual
   * @type {}
   */
  eventData: undefined,
});
