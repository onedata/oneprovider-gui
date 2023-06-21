/**
 * The component that is rendered in an iframe, that is embedded in other Ember
 * application (in `one-embedded-component-container`). It will share common
 * object with it's parent window via iframe element's `appProxy` property.
 * Only one `one-embedded-component` can be used in and iframe at the same time!
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { defineProperty, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import globals from 'onedata-gui-common/utils/globals';

export default Component.extend({
  classNames: ['one-embedded-component'],

  appProxy: service(),

  /**
   * @virtual optional
   * @type {Array<string>}
   */
  iframeInjectedProperties: Object.freeze([]),

  /**
   * Must be a subset of `iframeInjectedProperties`
   * @virtual optional
   * @type {Array<string>}
   */
  iframeInjectedNavigationProperties: Object.freeze([]),

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @type {Element}
   */
  frameElement: computed(() => globals.window.frameElement),

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

  init() {
    this._super(...arguments);

    if (this.frameElement) {
      // create local callParent method that will simply invoke callParent
      // injected by parent frame
      this.callParent = function callParent() {
        return this.appProxy.callParent(...arguments);
      };

      // fetch declared injected properties
      this.iframeInjectedProperties.forEach(propertyName => {
        defineProperty(
          this,
          propertyName,
          reads(`appProxy.injectedData.${propertyName}`)
        );
      });

      // register navigation properties in app proxy
      this.appProxy.registerNavigationProperties(this.iframeInjectedNavigationProperties);
    } else {
      throw new Error(
        'component:one-embedded-component: view with this component must be rendered in an iframe'
      );
    }
  },

  willDestroyElement() {
    try {
      this.appProxy.unregisterNavigationProperties(
        this.iframeInjectedNavigationProperties
      );
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    containerScrollTop() {
      return this.containerScrollTop(...arguments);
    },
  },
});
