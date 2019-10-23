/**
 * The component that is rendered in an iframe, that is embedded in other Ember
 * application (in `one-embedded-component-container`). It will share common
 * object with it's parent window via iframe element's `appProxy` property.
 * Only one `one-embedded-component` can be used in and iframe at the same time!
 * 
 * @module components/one-embedded-component
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import {
  sharedObjectName,
  getSharedProperty,
} from 'onedata-gui-common/utils/one-embedded-common';

export default Component.extend({
  classNames: ['one-embedded-component'],

  /**
   * @type {Element}
   */
  frameElement: window.frameElement,

  /**
   * Properties:
   * - onezoneVersionDetails: object
   *   - serviceVersion: string
   *   - serviceBuildVersion: string
   * @type {object}
   */
  parentInfo: undefined,

  /**
   * Will invoke parent container action by name.
   * Is set on init.
   * Usage: `this.callParent(actionName, ...arguments)`.
   * @type {Function}
   */
  callParent: undefined,

  /**
   * Array with property names that are injected to common `appProxy` object
   * and are read on the init.
   * @virtual optional
   * @type {Array<string>}
   */
  iframeInjectedProperties: Object.freeze([]),

  init() {
    this._super(...arguments);
    const frameElement = this.get('frameElement');

    if (frameElement) {
      // notification of property change from parent will cause the property
      // value to be copied into this component instance
      frameElement[sharedObjectName].propertyChanged =
        this.copyExternalProperty.bind(this);

      // create local callParent method that will simply invoke callParent
      // injected by parent frame
      this.callParent = function callParent() {
        return frameElement[sharedObjectName].callParent(...arguments);
      };

      // standard property injected by parent frame
      this.copyExternalProperty('parentInfo');

      // fetch declared injected properties
      this.get('iframeInjectedProperties').forEach(propertyName => {
        this.copyExternalProperty(propertyName);
      });
    } else {
      throw new Error(
        'component:one-embedded-component: view with this component must be rendered in an iframe'
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

  /**
   * Get property injected by iframe container and set it in this component
   * instance. This should be done right after container (parent) updates
   * the property. The parent should do it using observers.
   * @param {string} key 
   * @return {any} value of the injected property
   */
  copyExternalProperty(key) {
    const value = getSharedProperty(
      this.get(`frameElement.${sharedObjectName}`),
      key
    );
    return this.set(key, value);
  },
});
