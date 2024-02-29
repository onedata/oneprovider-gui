import EmberObject from '@ember/object';

const EdmProperty = EmberObject.extend({
  /**
   * @virtual
   */
  value: undefined,

  /**
   * @virtual
   */
  attrs: undefined,

  /**
   * @virtual
   */
  namespace: undefined,

  /**
   * @virtual
   */
  edmPropertyType: undefined,

  shownAttrs: Object.freeze(['resource', 'lang', 'about']),

  objectTypes: Object.freeze([]),

  init() {
    this._super(...arguments);
    if (!this.attrs) {
      this.set('attrs', {});
    }
  },

  // FIXME: test: umożliwić dowolne property

  // FIXME: może tutaj string albo sparsowany Node
  xmlSource: '',
});

export default EdmProperty;
