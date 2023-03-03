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
import { defineProperty } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';

export default Component.extend({
  classNames: ['one-embedded-component'],

  appProxy: service(),

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @type {Element}
   */
  frameElement: reads('_window.frameElement'),

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
   * @type {Window}
   */
  _window: window,

  init() {
    this._super(...arguments);
    const frameElement = this.get('frameElement');

    if (frameElement) {
      // create local callParent method that will simply invoke callParent
      // injected by parent frame
      this.callParent = function callParent() {
        return this.get('appProxy').callParent(...arguments);
      };

      // fetch declared injected properties
      this.get('iframeInjectedProperties').forEach(propertyName => {
        defineProperty(
          this,
          propertyName,
          reads(`appProxy.injectedData.${propertyName}`)
        );
      });
    } else {
      throw new Error(
        'component:one-embedded-component: view with this component must be rendered in an iframe'
      );
    }
  },

  actions: {
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
  },
});
