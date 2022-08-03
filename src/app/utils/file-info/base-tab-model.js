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
   * Name of component to render in modal header.
   * @virtual
   * @type {string}
   */
  headerComponent: undefined,

  /**
   * Name of component to render in modal body.
   * @virtual
   * @type {string}
   */
  bodyComponent: undefined,

  /**
   * Name of component to render in modal footer.
   * If not specified, the footer will not be rendered.
   * @virtual optional
   * @type {string}
   */
  footerComponent: undefined,
});
