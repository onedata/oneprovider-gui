import { expect } from 'chai';
import { describe, it } from 'mocha';
import RootOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/root-operator-query-block';
import AndOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/and-operator-query-block';
import OrOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/or-operator-query-block';
import ExceptOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/except-operator-query-block';
import ConditionQueryBlock from 'onedata-gui-common/utils/query-builder/condition-query-block';
import queryBlockToQosExpression from 'oneprovider-gui/utils/query-block-to-qos-expression';

describe('Unit | Utility | query block to qos expression', function () {
  it(
    'generates QoS expression string from linear AND-only query block',
    function () {
      const andBlock = AndOperatorQueryBlock.create({
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
      });
      const rootBlock = RootOperatorQueryBlock.create({
        operands: [
          andBlock,
        ],
      });

      const result = queryBlockToQosExpression(rootBlock);

      expect(result).to.equal('hello=world&foo=bar&lorem=ipsum');
    }
  );

  it('generates QoS expression string from nested AND, OR query block', function () {
    const orBlock = OrOperatorQueryBlock.create({
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
    });
    const rootBlock = RootOperatorQueryBlock.create({
      operands: [
        orBlock,
      ],
    });

    const result = queryBlockToQosExpression(rootBlock);

    expect(result).to.equal('hello=world|(foo=bar&lorem=ipsum)');
  });

  it(
    'generates QoS expression with anyStorage except some property',
    function () {
      const exceptBlock = ExceptOperatorQueryBlock.create({
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
      });
      const rootBlock = RootOperatorQueryBlock.create({
        operands: [
          exceptBlock,
        ],
      });

      const result = queryBlockToQosExpression(rootBlock);

      expect(result).to.equal('anyStorage\\foo=bar');
    }
  );

  it('does not generate empty parenthesis from empty operator blocks beside non-empty', function () {
    const orBlock = OrOperatorQueryBlock.create({
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
    });
    const rootBlock = RootOperatorQueryBlock.create({
      operands: [
        orBlock,
      ],
    });

    const result = queryBlockToQosExpression(rootBlock);

    expect(result).to.equal('hello=world');
  });

  it('does not generate empty parenthesis from at least 3 nested block-visualiser', function () {
    const orBlock = OrOperatorQueryBlock.create({
      operands: [
        OrOperatorQueryBlock.create({
          operands: [
            OrOperatorQueryBlock.create({
              operands: [],
            }),
          ],
        }),
      ],
    });
    const rootBlock = RootOperatorQueryBlock.create({
      operands: [
        orBlock,
      ],
    });

    const result = queryBlockToQosExpression(rootBlock);

    expect(result).to.equal('');
  });
});
