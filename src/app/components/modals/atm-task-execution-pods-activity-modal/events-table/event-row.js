import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {JsonInfiniteLogEntry<OpenfaasFunctionEvent>}
   */
  eventEntry: undefined,

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
  rowIndex: reads('eventEntry.index'),

  /**
   * @type {ComputedProperty<number>}
   */
  timestamp: computed('eventEntry.timestamp', function () {
    const timestampMs = this.get('eventEntry.timestamp');
    return Number.isInteger(timestampMs) ? timestampMs / 1000 : null;
  }),

  /**
   * @type {ComputedProperty<OpenfaasFunctionEvent>}
   */
  eventData: reads('eventEntry.content'),

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
