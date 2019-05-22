/**
 * @module component/content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';

export default OneEmbeddedComponent.extend({
  classNames: ['content-file-browser'],

  init() {
    this._super(...arguments);
    this.copyExternalProperty('spaceId');
    this.copyExternalProperty('fileId');
  },

  didInsertElement() {
    this._super(...arguments);
    this.callParent('sayHello', 'world');
  },

  actions: {},
});
