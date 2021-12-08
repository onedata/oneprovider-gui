import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {JsonInfiniteLogValue<OpenfaasFunctionEvent>}
   */
  eventData: undefined,

  /**
   * @virtual
   * @type {string}
   */
  rowIndex: undefined,

  /**
   * @type {boolean}
   */
  isExpanded: undefined,

  /**
   * @type {(rowIndex: string) => void}
   */
  onToggleExpand: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  eventDataAsJson: computed('eventData', function eventDataAsJson() {
    return JSON.stringify(this.get('eventData'), null, 2);
  }),

  actions: {
    onToggleExpand() {
      const {
        rowIndex,
        onToggleExpand,
      } = this.getProperties('rowIndex', 'onToggleExpand');

      if (onToggleExpand) {
        onToggleExpand(rowIndex);
      }
    },
  },
});
