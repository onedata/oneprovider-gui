/**
 * Shows "use selection" button.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.inputStoresForm.useSelectionButton',

  /**
   * @virtual
   * @type {Utils.FormComponent.FormField}
   */
  field: undefined,

  actions: {
    click() {
      this.get('field').useValueFromSelection();
    },
  },
});
