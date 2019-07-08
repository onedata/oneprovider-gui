import Component from '@ember/component';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';

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

  moreToolsOpen: false,

  // TODO: title should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  // FIXME: maybe to remove
  moreMenuDisabled: computed('selectionContext', function moreMenuDisabled() {
    return !this.get('selectionContext').startsWith('single');
  }),

  toolbarButtons: computed('allButtonsArray', function buttons() {
    return getButtonActions(this.get('allButtonsArray'), 'inDir');
  }),

  toolbarButtonIds: computed('toolbarButtons.@each.id', function toolbarButtonIds() {
    return this.get('toolbarButtons').mapBy('id');
  }),

  moreMenuButtons: computed(
    'allButtonsArray',
    'toolbarButtonIds',
    'selectionContext',
    function moreMenuButtons() {
      const {
        allButtonsArray,
        toolbarButtonIds,
        selectionContext,
      } = this.getProperties(
        'allButtonsArray',
        'toolbarButtonIds',
        'selectionContext',
      );

      const allContextButtons = getButtonActions(allButtonsArray, selectionContext);
      return allContextButtons.filter(b => !toolbarButtonIds.includes(get(b, 'id')));
    }
  ),

  actions: {
    buttonClicked(button) {
      return get(button, 'action')();
    },
    toggleMoreTools(open) {
      this.set('moreToolsOpen', open);
    },
  },
});
