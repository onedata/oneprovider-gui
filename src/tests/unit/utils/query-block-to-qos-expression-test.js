import { expect } from 'chai';
import { describe, it } from 'mocha';
import RootOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/root-operator-query-block';
import AndOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/and-operator-query-block';
import OrOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/or-operator-query-block';
import ExceptOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/except-operator-query-block';
import ConditionQueryBlock from 'onedata-gui-common/utils/query-builder/condition-query-block';
import queryBlockToQosExpression from 'oneprovider-gui/utils/query-block-to-qos-expression';

describe('Unit | Utility | query block to qos expression', function () {
  itGeneratesString('from linear AND-only query block',

    AndOperatorQueryBlock.create({
      operands: [
        ConditionQueryBlock.create({
          property: {
            key: 'hello',
            type: 'string',
          },
          comparator: 'string.eq',
          comparatorValue: 'world',
        }),
        ConditionQueryBlock.create({
          property: {
            key: 'foo',
            type: 'string',
          },
          comparator: 'string.eq',
          comparatorValue: 'bar',
        }),
        ConditionQueryBlock.create({
          property: {
            key: 'lorem',
            type: 'string',
          },
          comparator: 'string.eq',
          comparatorValue: 'ipsum',
        }),
      ],
    }),

    'hello=world&foo=bar&lorem=ipsum'
  );

  itGeneratesString('from nested AND, OR query block',

    OrOperatorQueryBlock.create({
      operands: [
        ConditionQueryBlock.create({
          property: {
            key: 'hello',
            type: 'string',
          },
          comparator: 'string.eq',
          comparatorValue: 'world',
        }),
        AndOperatorQueryBlock.create({
          operands: [
            ConditionQueryBlock.create({
              property: {
                key: 'foo',
                type: 'string',
              },
              comparator: 'string.eq',
              comparatorValue: 'bar',
            }),
            ConditionQueryBlock.create({
              property: {
                key: 'lorem',
                type: 'string',
              },
              comparator: 'string.eq',
              comparatorValue: 'ipsum',
            }),
          ],
        }),
      ],
    }),

    'hello=world|(foo=bar&lorem=ipsum)'
  );

  itGeneratesString('from anyStorage except some property query block',

    ExceptOperatorQueryBlock.create({
      operands: [
        ConditionQueryBlock.create({
          property: {
            key: 'anyStorage',
            type: 'symbol',
          },
          comparator: null,
        }),
        ConditionQueryBlock.create({
          property: {
            key: 'foo',
            type: 'string',
          },
          comparator: 'string.eq',
          comparatorValue: 'bar',
        }),
      ],
    }),

    'anyStorage\\foo=bar'
  );

  itGeneratesString('without empty parenthesis from empty operator blocks beside non-empty',

    OrOperatorQueryBlock.create({
      operands: [
        ConditionQueryBlock.create({
          property: {
            key: 'hello',
            type: 'string',
          },
          comparator: 'string.eq',
          comparatorValue: 'world',
        }),
        AndOperatorQueryBlock.create({
          operands: [],
        }),
      ],
    }),

    'hello=world'
  );

  itGeneratesString('without empty parenthesis from at least 3 nested block-visualiser',

    OrOperatorQueryBlock.create({
      operands: [
        OrOperatorQueryBlock.create({
          operands: [
            OrOperatorQueryBlock.create({
              operands: [],
            }),
          ],
        }),
      ],
    }),

    ''
  );
});

function itGeneratesString(description, rootChildBlock, expectedString) {
  it(description, function () {
    const rootBlock = RootOperatorQueryBlock.create({
      operands: [
        rootChildBlock,
      ],
    });

    const result = queryBlockToQosExpression(rootBlock);

    expect(result).to.equal(expectedString);
  });
}
