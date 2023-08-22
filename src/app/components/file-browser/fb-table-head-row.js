/**
 * Row of file browser table header (thead)
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['fb-table-head-row'],

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @type {ComputedProperty<Utils.ColumnsConfiguration>}
   */
  columnsConfiguration: reads('browserModel.columnsConfiguration'),

  didInsertElement() {
    this._super(...arguments);
    this.browserModel.columnsConfiguration.checkColumnsVisibility();
  },
});
