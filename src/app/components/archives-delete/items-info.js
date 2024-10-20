/**
 * Basic stylized information about one or more archives to delete.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { equal, raw } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['archives-delete-items-info', 'browsable-items-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.archivesDelete.itemsInfo',

  /**
   * @virtual
   * @type {Array<Utils.BrowsableArchive>}
   */
  items: undefined,

  /**
   * @type {ComputedProperty<Utils.BrowsableArchive>}
   */
  firstItem: reads('items.firstObject'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isSingleItem: equal('items.length', raw(1)),
});
