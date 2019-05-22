/**
 * The component that is rendered in an iframe, that is embedded in other Ember
 * application (in `one-embedded-component-container`). It will share common
 * object with it's parent window via iframe element's `onedataBindings` property.
 * Only one `one-embedded-component` can be used in and iframe at the same time!
 * 
 * @module components/one-embedded-component
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['one-embedded-component'],

  /**
   * @type {Element}
   */
  frameElement: window.frameElement,

  parentInfo: undefined,

  callParent: undefined,

  init() {
    this._super(...arguments);
    const frameElement = this.get('frameElement');

    if (frameElement) {
      frameElement.onedataBindings.propertyChanged =
        this.copyExternalProperty.bind(this);
      this.set(
        'callParent',
        function () {
          return frameElement.onedataBindings
            .callParent('get', 'callParent', ...arguments);
        }
      );
      this.copyExternalProperty('parentInfo');
    } else {
      throw new Error(
        'component:one-embedded-component: view with this component must be rendered in a iframe'
      );
    }
  },

  willDestroyElement() {
    try {
      this.callParent('willDestroyEmbeddedComponent');
    } finally {
      this._super(...arguments);
    }
  },

  copyExternalProperty(key) {
    return this.set(
      key,
      this.callParent('get', key)
    );
  },
});
