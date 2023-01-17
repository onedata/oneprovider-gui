/**
 * Content of popup with information about space
 * 
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import SpaceInfoContent from 'onedata-gui-common/components/space-info-content';

export default SpaceInfoContent.extend({
  /**
   * @override
   */
  showRestApiModalLink: true,

  actions: {
    openRestApiModal() {
      return this.get('openRestApiModal')(this.space);
    },
  },
});
