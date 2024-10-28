/**
 * Base implementation of empty dir view in browser table
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['empty-dir-box', 'dir-box'],

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  previewMode: reads('browserModel.previewMode'),
});
