/**
 * Representation of provider
 * 
 * @module components/query-builder/model-presenters/-generic
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from '../../../templates/components/query-builder/model-presenters/provider';

export default Component.extend({
  layout,

  /**
   * @virtual
   * @type {Models.Provider|String}
   */
  itemValue: undefined,

  onlyId: computed('itemValue', function onlyId() {
    return typeof this.get('itemValue') === 'string';
  }),
});
