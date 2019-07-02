import Component from '@ember/component';
import { get, computed } from '@ember/object';

export default Component.extend({
  classNames: ['fb-toolbar'],

  dir: undefined,

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

  // TODO: title should be a translation key, when rendered, it will get
  // name of element: directory, directories, file, files, elements or current directory
  // To avoid using "element"

  toolbarButtons: computed('selectionContext', function buttons() {
    const selectionContext = this.get('selectionContext');
    const getActions = this.get('getActions');
    let multiMixed = getActions('multiMixed');
    if (selectionContext === 'none') {
      multiMixed = multiMixed.map(action =>
        Object.assign({ disabled: true }, action)
      );
    }
    return [
      ...getActions('inDir'),
      { type: 'separator' },
      // show only buttons that can handle any multiple selection
      ...multiMixed,
    ];
  }),

  actions: {
    buttonClicked(button) {
      return get(button, 'action')();
    },
  },
});
