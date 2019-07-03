import Component from '@ember/component';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['fb-toolbar'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbToolbar',

  dir: undefined,

  /**
   * @virtual
   * @type {Array<object>}
   */
  allButtonsArray: undefined,

  /**
   * @virtual
   * @type {string}
   */
  selectionContext: 'none',

  /**
   * @virtual
   * @type {Function}
   */
  getActions: undefined,

  moreToolsOpen: false,

  // TODO: title should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  moreMenuDisabled: computed('selectionContext', function moreMenuDisabled() {
    return !this.get('selectionContext').startsWith('single');
  }),

  toolbarButtons: computed('selectionContext', function buttons() {
    const selectionContext = this.get('selectionContext');
    let multiMixed = this.getButtonActions('multiMixed');
    if (selectionContext === 'none') {
      multiMixed = multiMixed.map(action =>
        Object.assign({ disabled: true }, action)
      );
    }
    return [
      ...this.getButtonActions('inDir'),
      { id: 'separator', type: 'separator' },
      // show only buttons that can handle any multiple selection
      ...multiMixed,
    ];
  }),

  toolbarButtonIds: computed('toolbarButtons.@each.id', function toolbarButtonIds() {
    return this.get('toolbarButtons').mapBy('id');
  }),

  moreMenuButtons: computed('selectionContext', function menuButtons() {
    const toolbarButtonIds = this.get('toolbarButtonIds');
    const allContextButtons = this.getButtonActions(this.get('selectionContext'));
    return allContextButtons.filter(b => !toolbarButtonIds.includes(get(b, 'id')));
  }),

  getButtonActions(context) {
    return this.get('allButtonsArray')
      .filter(b => get(b, 'showIn').includes(context));
  },

  actions: {
    buttonClicked(button) {
      return get(button, 'action')();
    },
    toggleMoreTools(open) {
      this.set('moreToolsOpen', open);
    },
  },
});
