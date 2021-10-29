import { expect } from 'chai';
import { describe, it } from 'mocha';
import pathShorten from 'oneprovider-gui/utils/path-shorten';

const ellipsis = 'ellipsis';

const shortSource = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('Unit | Utility | path shorten', function () {
  it('returns [ell] for length 0', function () {
    const result = pathShorten(shortSource, ellipsis, 0);

    expectSameArrays(result, [ellipsis]);
  });

  it('returns [i_1] for length 1', function () {
    const result = pathShorten(shortSource, ellipsis, 1);

    expectSameArrays(result, ['a']);
  });

  it('returns [i_1, e] for length 2', function () {
    const result = pathShorten(shortSource, ellipsis, 2);

    expectSameArrays(result, ['a', ellipsis]);
  });

  it('returns [i_1, e, i_-1] for length 3', function () {
    const result = pathShorten(shortSource, ellipsis, 3);

    expectSameArrays(result, ['a', ellipsis, 'f']);
  });

  it('returns [i_1, i_2, e, i_-1] for length 4', function () {
    const result = pathShorten(shortSource, ellipsis, 4);

    expectSameArrays(result, ['a', 'b', ellipsis, 'f']);
  });

  it('returns [i_1, i_2, e, i_-2, i_-1] for length 5', function () {
    const result = pathShorten(shortSource, ellipsis, 5);

    expectSameArrays(result, ['a', 'b', ellipsis, 'e', 'f']);
  });

  it('returns array with one item turned into an ellipsis for length 6 for 6-items array', function () {
    const result = pathShorten(shortSource, ellipsis, 6);

    expectSameArrays(result, ['a', 'b', 'c', ellipsis, 'e', 'f']);
  });

  it('returns array with all items without ellipsis for length 7 for 6-items array', function () {
    const result = pathShorten(shortSource, ellipsis, 7);

    expectSameArrays(result, ['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('returns array with all items without ellipsis for length 10 for 6-items array', function () {
    const result = pathShorten(shortSource, ellipsis, 10);

    expectSameArrays(result, ['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('returns array with all items without ellipsis for length 7 for 7-items array', function () {
    const result = pathShorten(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      7,
      10
    );

    expectSameArrays(result, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });
});

function expectSameArrays(result, expected) {
  expect(result.join(', ')).to.equal(expected.join(', '));
}
