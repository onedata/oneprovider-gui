/**
 * Provides data and implementation of utils specific for oneprovider-gui
 *
 * @module services/gui-utils
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import GuiUtils from 'onedata-gui-common/services/gui-utils';
import modelRoutableId from 'oneprovider-gui/utils/model-routable-id';

export default GuiUtils.extend({
  /**
   * @override
   */
  getRoutableIdFor(model) {
    return modelRoutableId(model);
  },
});
