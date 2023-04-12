/**
 * Content of popup with information about space
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import SpaceInfoContent from 'onedata-gui-common/components/space-info-content';
import { inject as service } from '@ember/service';

export default SpaceInfoContent.extend({
  appProxy: service(),

  /**
   * @override
   */
  showLinkToRestApiModal: true,

  /**
   * @override
   */
  showCreator: false,

  onOpenRestApiModal() {
    return this.appProxy.callParent('openRestApiModal', this.record);
  },
});
