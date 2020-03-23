/**
 * Show information about single QoS record
 * 
 * @module components/qos-modal/qos-entry
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { conditional, raw } from 'ember-awesome-macros';
import { reads, equal } from '@ember/object/computed';
import { computed } from '@ember/object';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const statusClasses = {
  fulfilled: 'success',
  fileFulfilled: 'info',
  pending: 'default',
};

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntry',

  /**
   * @virutal
   * @type {Component}
   */
  collapsibleList: undefined,

  /**
   * @virtual
   */
  qos: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  direct: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  fileFulfilled: undefined,

  /**
   * One of: show, new
   */
  mode: 'show',

  readonly: equal('mode', 'show'),

  replicasNumber: reads('qos.replicasNum'),

  expression: reads('qos.expression'),

  fulfilled: reads('qos.fulfilled'),

  /**
   * One of: fileFulfilled, fulfilled, pending
   * @type {ComputedProperty<String>}
   */
  // statusId: conditional(
  //   'direct',
  //   conditional(
  //     'fulfilled',
  //     raw('fulfilled'),
  //     conditional('fileFulfilled', raw('fileFulfilled'), raw('pending'))
  //   ),
  //   conditional('fulfilled', raw('fulfilled'), raw('pending')),
  // ),

  statusId: computed('fileFulfilled', 'fulfilled', function () {
    const {
      fileFulfilled,
      fulfilled,
      direct,
    } = this.getProperties('fileFulfilled', 'fulfilled', 'direct');
    if (direct) {
      if (fulfilled) {
        return 'fulfilled';
      } else {
        if (fileFulfilled) {
          return 'fileFulfilled';
        } else {
          return 'pending';
        }
      }
    } else {
      if (fulfilled) {
        return 'fulfilled';
      } else {
        return 'pending';
      }
    }
  }),

  statusText: computed('statusId', function statusText() {
    return this.t(this.get('statusId'));
  }),

  statusClass: computed('statusId', function statusClass() {
    return statusClasses[this.get('statusId')];
  }),

  headerText: conditional(
    equal('mode', raw('new')),
    computedT('new'),
    'expression',
  ),

  actions: {
    disableEnterKey(keyEvent) {
      if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
      }
    },
  },
});
