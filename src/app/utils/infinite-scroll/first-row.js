import EmberObject, { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {number}
   */
  singleRowHeight: 0,

  /**
   * @virtual
   * @type {ReplacingChunksArray}
   */
  entries: undefined,

  /**
   * @type {ComputedProperty<number>}
   */
  height: computed(
    'singleRowHeight',
    'entries._start',
    function height() {
      const _start = this.get('entries._start');
      return _start ? _start * this.get('rowHeight') : 0;
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  style: computed('height', function style() {
    return htmlSafe(`height: ${this.get('height')}px;`);
  }),
});
