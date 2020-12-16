import RootOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/root-operator-query-block';
import AndOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/and-operator-query-block';
import OrOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/or-operator-query-block';
import ExceptOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/except-operator-query-block';
import ConditionQueryBlock from 'onedata-gui-common/utils/query-builder/condition-query-block';
import { qosRpnToObject } from 'oneprovider-gui/utils/qos-expression-converters';
import { A } from '@ember/array';

const queryBlockOperatorClass = {
  union: OrOperatorQueryBlock,
  intersect: AndOperatorQueryBlock,
  complement: ExceptOperatorQueryBlock,
};

function getPropertyType(value) {
  if (isNaN(parseFloat(value))) {
    return 'string';
  } else {
    return 'number';
  }
}

function expandQueryBlock(obj) {
  if (obj.type === 'group') {
    return queryBlockOperatorClass[obj.operator].create({
      operands: A([expandQueryBlock(obj.a), expandQueryBlock(obj.b)]),
    });
  } else if (obj.type === 'pair') {
    const propertyType = getPropertyType(obj.value);
    return ConditionQueryBlock.create({
      property: {
        key: obj.key,
        type: propertyType,
      },
      comparator: `${propertyType}.${obj.operator}`,
      comparatorValue: obj.value,
    });
  } else if (obj.type === 'variable') {
    return ConditionQueryBlock.create({
      property: {
        key: obj.name,
        type: 'symbol',
      },
      comparator: null,
    });
  } else {
    throw new Error(`unrecognized qos object type: ${obj.type}`);
  }
}

export default function qosRpnToQueryBlock(rpnData) {
  const rpnObject = qosRpnToObject(rpnData);

  const root = RootOperatorQueryBlock.create({
    operands: A([expandQueryBlock(rpnObject)]),
  });
  return root;
}
