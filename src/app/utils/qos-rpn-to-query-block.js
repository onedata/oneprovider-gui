/**
 * Create root query block model from QoS expression RPN (array of strings).
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import RootOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/root-operator-query-block';
import AndOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/and-operator-query-block';
import OrOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/or-operator-query-block';
import ExceptOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/except-operator-query-block';
import ConditionQueryBlock from 'onedata-gui-common/utils/query-builder/condition-query-block';
import { qosRpnToObject } from 'oneprovider-gui/utils/qos-expression-converters';
import { A } from '@ember/array';
import { get } from '@ember/object';
import _ from 'lodash';

const queryBlockOperatorClass = {
  union: OrOperatorQueryBlock,
  intersect: AndOperatorQueryBlock,
  complement: ExceptOperatorQueryBlock,
};

const isDecimalFloatRe = /^(\d+|(\d+\.\d+))$/;

function getPropertyType(value) {
  if (value == null) {
    return 'symbol';
  } else if (typeof value === 'number' || isDecimalFloatRe.test(value)) {
    return 'number';
  } else {
    return 'string';
  }
}

/**
 * @param {Object} options
 * @param {Object} options.obj expression element - see `qosRpnToObject` util
 * @param {Object} options.props mapping of query property key -> query property
 * @param {Array<Models.Provider>} options.providers
 * @param {Array<StorageModel>} options.storage
 * @returns {OnedataGuiCommon.Utils.QueryBlock}
 */
function expandQueryBlock({ obj, props = {}, storages = [], providers = [] }) {
  if (obj.type === 'group') {
    return queryBlockOperatorClass[obj.operator].create({
      operands: A([
        expandQueryBlock({ obj: obj.a, props, storages, providers }),
        expandQueryBlock({ obj: obj.b, props, storages, providers }),
      ]),
    });
  } else if (obj.type === 'pair') {
    const property = props[obj.key] || {
      key: obj.key,
      displayedKey: obj.key,
      type: getPropertyType(obj.value),
    };
    const propertyType = get(property, 'type');
    const operator = propertyType === 'storage' || propertyType === 'provider' ?
      'is' : obj.operator;
    let comparatorValue;
    // for storage and provider fallback to string id of model if model not exists
    switch (propertyType) {
      case 'storage':
        comparatorValue = storages.findBy('entityId', obj.value) || String(obj.value);
        break;
      case 'provider':
        comparatorValue = providers.findBy('entityId', obj.value) || String(obj.value);
        break;
      default:
        comparatorValue = obj.value;
        break;
    }
    return ConditionQueryBlock.create({
      property,
      comparator: `${propertyType}.${operator}`,
      comparatorValue,
    });
  } else if (obj.type === 'variable') {
    const property = props[obj.name] || {
      key: obj.name,
      displayedKey: obj.name,
      type: 'symbol',
    };
    return ConditionQueryBlock.create({
      property,
      comparator: null,
    });
  } else {
    throw new Error(`unrecognized qos object type: ${obj.type}`);
  }
}

/**
 * @param {Object} options
 * @param {Array<String>} options.rpnData RPN of expression as recieved from backend
 * @param {Array<QueryProperty>} options.queryProperties
 *   see `component:qos-add#fetchQueryProperties`
 * @param {Array<Models.Provider>} options.providers
 * @param {Array<StorageModel>} options.storages
 * @returns {RootOperatorQueryBlock}
 */
export default function qosRpnToQueryBlock({
  rpnData,
  queryProperties,
  providers,
  storages,
}) {
  const rpnObject = qosRpnToObject(rpnData);

  const props = _.keyBy(queryProperties, queryProperty => get(queryProperty, 'key'));
  const root = RootOperatorQueryBlock.create({
    operands: A([expandQueryBlock({ obj: rpnObject, props, providers, storages })]),
  });
  return root;
}
