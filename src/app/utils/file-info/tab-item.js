/**
 * Implements interface of FileInfoTabItem type using tab models.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.FileInfo.BaseTabModel}
   */
  tabModel: undefined,

  id: reads('tabModel.tabId'),
  name: reads('tabModel.title'),
  statusIcon: reads('tabModel.statusIcon'),
  statusNumber: reads('tabModel.statusNumber'),
  statusTag: reads('tabModel.statusTag'),
  statusIconTip: reads('tabModel.statusIconTip'),
  tabClass: reads('tabModel.tabClass'),

  disabled: false,
});
