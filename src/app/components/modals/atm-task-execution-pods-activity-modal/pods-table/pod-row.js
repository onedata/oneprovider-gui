import Component from '@ember/component';
import isDirectlyClicked from 'onedata-gui-common/utils/is-directly-clicked';

export default Component.extend({
  tagName: 'tr',
  classNames: ['pods-table-pod-row'],
  classNameBindings: ['isSelected'],
  attributeBindings: ['podId:data-pod-id'],

  /**
   * @virtual
   * @type {OpenfaasPodId}
   */
  podId: undefined,

  /**
   * @virtual
   * @type {OpenfaasPodActivity}
   */
  podActivity: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  isSelected: undefined,

  /**
   * @virtual
   * @type {(podId: OpenfaasPodId) => void}
   */
  onSelect: undefined,

  /**
   * @override
   */
  click(event) {
    this._super(...arguments);

    const {
      element,
      onSelect,
      podId,
    } = this.getProperties('element', 'onSelect', 'podId');

    if (isDirectlyClicked(event, element) && onSelect) {
      onSelect(podId);
    }
  },
});
