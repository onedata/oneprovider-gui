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
import { trySet } from '@ember/object';
import { next } from '@ember/runloop';
import browser, { BrowserName } from 'onedata-gui-common/utils/browser';
import { reads } from '@ember/object/computed';

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

  /**
   * @type {ComputedProperty<string>}
   */
  columnsCount: reads('browserModel.columnsOrder.length'),

  /**
   * @type {boolean}
   */
  arrowTooltipVisible: true,

  /**
   * @type {Boolean}
   */
  isInFirefox: browser.name === BrowserName.Firefox,

  applyCurrentColumnsOrder() {
    this.browserModel.saveColumnsOrder();
    this.browserModel.checkColumnsVisibility();
    this.browserModel.notifyPropertyChange('columnsOrder');
    // workaround to bug in firefox
    // tooltip not disappeared after click and move element
    if (this.isInFirefox) {
      this.set('arrowTooltipVisible', false);
      next(() => trySet(this, 'arrowTooltipVisible', true));
    }
  },

  actions: {
    checkboxChanged(columnName, newValue) {
      this.browserModel.changeColumnVisibility(columnName, newValue);
    },
    moveColumnDown(columnName) {
      const columnsOrder = this.browserModel.columnsOrder;
      const indexOfColumn = columnsOrder.indexOf(columnName);

      if (indexOfColumn === -1 || indexOfColumn + 1 >= columnsOrder.length) {
        return;
      }

      const columnToSwitch = columnsOrder[indexOfColumn + 1];
      columnsOrder[indexOfColumn + 1] = columnName;
      columnsOrder[indexOfColumn] = columnToSwitch;
      this.applyCurrentColumnsOrder();
    },
    moveColumnUp(columnName) {
      const columnsOrder = this.browserModel.columnsOrder;
      const indexOfColumn = columnsOrder.indexOf(columnName);

      if (indexOfColumn === -1 || indexOfColumn <= 0) {
        return;
      }

      if (indexOfColumn - 1 >= 0) {
        const columnToSwitch = columnsOrder[indexOfColumn - 1];
        columnsOrder[indexOfColumn - 1] = columnName;
        columnsOrder[indexOfColumn] = columnToSwitch;
        this.applyCurrentColumnsOrder();
      }
    },
  },
});
