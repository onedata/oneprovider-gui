import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  classNames: ['list-entry'],

  /**
   * @type {Models.AtmWorkflowSchema}
   */
  atmWorkflowSchema: undefined,

  /**
   * @type {Function}
   * @returns {any}
   */
  onSelect: notImplementedIgnore,

  click() {
    this._super(...arguments);

    const onSelect = this.get('onSelect');
    onSelect && onSelect();
  },
});
