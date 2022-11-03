/**
 * Tab bar item implementation for file info modal. It supports presenting features
 * provided by `FileInfoTabItem` objects (status icons, etc.).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import TabBarLi from 'onedata-gui-common/components/one-tab-bar/tab-bar-li';
import layout from '../../templates/components/file-info-modal/tab-bar-li';

export default TabBarLi.extend({
  layout,

  /**
   * @virtual
   * @type {FileInfoTabItem}
   */
  item: undefined,
});
