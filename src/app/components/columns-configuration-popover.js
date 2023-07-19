/**
 * Renders columns configuration popover.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['columns-configuration-popover'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationPopover',

  /**
   * @virtual
   * @type {string}
   */
  triggerSelector: undefined,

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isOpened: false,

  actions: {
    checkboxChanged(columnName, newValue) {
      this.browserModel.changeColumnVisibility(columnName, newValue);
    },
    moveColumnDown(columnName) {
      const columnsOrder = this.browserModel.columnsOrder;
      const indexOfColumn = columnsOrder.indexOf(columnName);

      if (indexOfColumn + 1 < columnsOrder.length) {
        const columnToSwitch = columnsOrder[indexOfColumn + 1];
        columnsOrder[indexOfColumn + 1] = columnName;
        columnsOrder[indexOfColumn] = columnToSwitch;
        this.browserModel.saveColumnsOrder();
        this.browserModel.checkColumnsVisibility();
        this.browserModel.notifyPropertyChange('columnsOrder');
      }
    },
    moveColumnUp(columnName) {
      const columnsOrder = this.browserModel.columnsOrder;
      const indexOfColumn = columnsOrder.indexOf(columnName);

      if (indexOfColumn - 1 >= 0) {
        const columnToSwitch = columnsOrder[indexOfColumn - 1];
        columnsOrder[indexOfColumn - 1] = columnName;
        columnsOrder[indexOfColumn] = columnToSwitch;
        this.browserModel.saveColumnsOrder();
        this.browserModel.checkColumnsVisibility();
        this.browserModel.notifyPropertyChange('columnsOrder');
      }
    },
  },
});
