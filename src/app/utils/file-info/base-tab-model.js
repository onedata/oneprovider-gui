/**
 * Abstract class for creating model classes that provide logic for look and behavior
 * of single feature tab in file-info-modal.
 *
 * Subclasses define logic for tab look and behavior and provides paths of componnets
 * that will be rendered as file-info-modal parts (header/body/footer) when the tab
 * is activated. This model is also responsible for creating `viewModel` instance that
 * should be lazily created in this tab-model (just use computed property that returns
 * specific `viewModel` instance), which is injected as dependency into modal parts
 * components.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
   * Icon that will be rendered on the right of text as tab status.
   * @virtual optional
   * @type {string}
   */
  statusIcon: undefined,

  /**
   * @virtual optional
   * @type {string}
   */
  tabClass: '',

  /**
   * Name of component to render in modal header.
   * @virtual optional
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

  /**
   * Invoked by file info modal when it wants to close the current tab.
   * Return true to allow tab close.
   * Return false to cancel closing the file info modal.
   * Returing null or undefined will be considered as true.
   * @virtual optional
   * @returns {boolean}
   */
  tryClose() {
    return true;
  },
});
