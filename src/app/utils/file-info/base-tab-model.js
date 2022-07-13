import EmberObject from '@ember/object';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {string}
   */
  tabId: undefined,

  /**
   * @virtual
   * @type {SafeString|string}
   */
  title: undefined,

  /**
   * @virtual
   * @type {EmberObject|Object}
   */
  viewModel: undefined,

  /**
   * Name of component to render in modal body.
   * @virtual
   * @type {string}
   */
  bodyComponent: undefined,
});
