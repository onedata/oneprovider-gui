import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { observer, get, computed } from '@ember/object';
import { gt } from '@ember/object/computed';

export default Component.extend(I18n, {
  classNames: ['fb-selection-toolkit'],
  classNameBindings: ['opened:opened:closed'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbSelectionToolkit',

  /**
   * @virtual
   */
  allButtonsArray: undefined,

  /**
   * @virtual
   */
  selectionContext: undefined,

  itemsCount: 0,

  lastPositiveItemsCount: 0,

  fileActionsOpen: false,

  rememberLastPositiveCount: observer(
    'itemsCount',
    function rememberLastPositiveCount() {
      const itemsCount = this.get('itemsCount');
      if (itemsCount > 0) {
        this.set('lastPositiveItemsCount', itemsCount);
      }
    }
  ),

  menuButtons: computed('selectionContext', function buttons() {
    return this.getButtonActions(this.get('selectionContext'));
  }),

  getButtonActions(context) {
    return this.get('allButtonsArray')
      .filter(b => get(b, 'showIn').includes(context));
  },

  opened: gt('itemsCount', 0),

  actions: {
    toggleFileActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('fileActionsOpen');
      this.set('fileActionsOpen', _open);
    },
  },
});
