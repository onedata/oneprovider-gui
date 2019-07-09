/**
 * Container for file browser to use in an iframe with injected properties.
 * 
 * @module component/content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';

export default OneEmbeddedComponent.extend({
  classNames: ['content-file-browser'],

  /**
   * @override
   */
  iframeInjectedProperties: Object.freeze(['spaceId', 'fileId']),
});
