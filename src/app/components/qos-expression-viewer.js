/**
 * A contaniner for creating tokenized and stylized view of QoS logical expression
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import qosRpnToQueryBlock from 'oneprovider-gui/utils/qos-rpn-to-query-block';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

export default Component.extend({
  classNames: ['qos-expression-viewer'],

  /**
   * RPN representation of QoS expression, eg.
   *`["storage", "sda", "=", "speed", "40", "=", "|"]`
   * @virtual
   * @type {Array<String>}
   */
  expressionRpn: undefined,

  /**
   * @virtual
   * @type {Utils.QueryComponentValueBuilder}
   */
  valuesBuilder: undefined,

  /**
   * See: `service:space-manager#getAvailableQosParameters`
   * @virtual
   * @type {Array<QueryProperty>}
   */
  queryProperties: undefined,

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * @type {Array<StorageModel>}
   */
  storages: undefined,

  /**
   * Root object of expression tree, one of expression part objects
   * @type {ComputedProperty<Utils.RootOperatorQueryBlock>}
   */
  rootQueryBlock: destroyableComputed(
    'expressionRpn',
    'queryProperties',
    'providers',
    'storages',
    function rootQueryBlock() {
      const {
        expressionRpn,
        queryProperties,
        providers,
        storages,
      } = this.getProperties('expressionRpn', 'queryProperties', 'providers', 'storages');
      try {
        return qosRpnToQueryBlock({
          rpnData: expressionRpn,
          queryProperties,
          providers,
          storages,
        });
      } catch (error) {
        // this error report is silent, because it can be multiple recomputations of this
        // property and there shouldn't be too much side effect
        console.error(
          `component:qos-expression-viewer#rootQueryBlock: ${error}; RPN: ${JSON.stringify(expressionRpn)}`
        );
        return null;
      }
    }
  ),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },
});
