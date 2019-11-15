import { expect } from 'chai';
import { describe, it } from 'mocha';
import bidirectionalPairs from 'oneprovider-gui/utils/bidirectional-pairs';

import _ from 'lodash';

describe('Unit | Utility | bidirectional pairs', function () {
  it('generates an array of undirected connections', function () {
    const mapping = {
      p1: ['p0'],
      p2: ['p0', 'p1'],
      p0: ['p1'],
    };

    let result = bidirectionalPairs(mapping);
    expect(result).to.have.length(3);
    expect(_.find(result, pair => _.isEqual(pair, ['p0', 'p1'])), 'p0-p1')
      .to.be.ok;
    expect(_.find(result, pair => _.isEqual(pair, ['p0', 'p2'])), 'p0-p2')
      .to.be.ok;
    expect(_.find(result, pair => _.isEqual(pair, ['p1', 'p2'])), 'p1-p2')
      .to.be.ok;
  });
});
